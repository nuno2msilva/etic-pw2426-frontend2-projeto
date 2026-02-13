/**
 * middleware/auth.ts — JWT authentication & authorisation
 *
 * Auth model (password-only, no usernames):
 *   - Customer: authenticates with a per-table 4-digit PIN → JWT locked to that tableId
 *   - Kitchen:  authenticates with the kitchen password → JWT with role "kitchen"
 *   - Manager:  authenticates with the manager password → JWT with role "manager"
 *
 * The JWT is stored in an httpOnly cookie so the browser sends it
 * automatically. The token contains { role, tableId?, pinVersion?, jti, iat, exp }.
 *
 * Table lock strategy:
 *   When a customer logs in for Table 3, the JWT's `tableId` claim is "3".
 *   All subsequent requests are verified against that claim — the customer
 *   cannot access or order for any other table without re-authenticating.
 */

import { createHash, randomUUID } from "crypto";
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

const JWT_SECRET = (() => {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET environment variable is required in production");
  }
  return secret ?? "sushi-dash-dev-secret-change-me";
})();
const TOKEN_EXPIRY = "8h";

/**
 * Two cookies allow a user to be logged in as customer AND staff
 * simultaneously (e.g. testing in the same browser).
 */
const COOKIE_CUSTOMER = "sushi_customer";
const COOKIE_STAFF    = "sushi_staff";

// ─── Types ────────────────────────────────────────────────────
export type AuthRole = "customer" | "kitchen" | "manager";

export interface TokenPayload {
  role: AuthRole;
  tableId?: number;
  pinVersion?: number;  // for customer sessions — invalidated when PIN changes
  jti: string;  // unique token ID for revocation
}

// Extend Express Request with auth info
declare global {
  namespace Express {
    interface Request {
      auth?: TokenPayload;
      staffAuth?: TokenPayload;
      customerAuth?: TokenPayload;
    }
  }
}

// ─── Helpers ──────────────────────────────────────────────────

/** SHA-256 hash (matches frontend) */
export function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

/** Create a signed JWT and set it as an httpOnly cookie */
export function issueToken(res: Response, payload: Omit<TokenPayload, "jti">): string {
  const jti = randomUUID();
  const token = jwt.sign({ ...payload, jti }, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY,
  });

  const cookieName = payload.role === "customer" ? COOKIE_CUSTOMER : COOKIE_STAFF;

  res.cookie(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 8 * 60 * 60 * 1000, // 8 hours
    path: "/",
  });

  return token;
}

/** Clear auth cookie(s). Pass a role to clear only that cookie, or omit to clear both. */
export function clearToken(res: Response, role?: AuthRole): void {
  if (!role || role === "customer") {
    res.clearCookie(COOKIE_CUSTOMER, { path: "/" });
  }
  if (!role || role !== "customer") {
    res.clearCookie(COOKIE_STAFF, { path: "/" });
  }
}

// ─── Middleware ───────────────────────────────────────────────

/**
 * authenticate — Verify JWT from cookie and attach `req.auth`.
 * Does NOT reject unauthenticated requests (use `requireRole` for that).
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  // Try staff cookie first (higher privilege), then customer cookie
  const staffToken = req.cookies?.[COOKIE_STAFF];
  const customerToken = req.cookies?.[COOKIE_CUSTOMER];

  // Also read legacy single cookie for backwards-compat during transition
  const legacyToken = req.cookies?.["sushi_token"];

  // Decode staff token
  let staffAuth: TokenPayload | undefined;
  for (const token of [staffToken, legacyToken]) {
    if (!token || staffAuth) continue;
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload & jwt.JwtPayload;
      if (decoded.role !== "customer") {
        staffAuth = { role: decoded.role, tableId: decoded.tableId, pinVersion: decoded.pinVersion, jti: decoded.jti };
      }
    } catch { /* expired / invalid */ }
  }

  // Decode customer token
  let customerAuth: TokenPayload | undefined;
  for (const token of [customerToken, legacyToken]) {
    if (!token || customerAuth) continue;
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload & jwt.JwtPayload;
      if (decoded.role === "customer") {
        customerAuth = { role: decoded.role, tableId: decoded.tableId, pinVersion: decoded.pinVersion, jti: decoded.jti };
      }
    } catch { /* expired / invalid */ }
  }

  // Attach both to req for downstream middleware
  req.staffAuth = staffAuth;
  req.customerAuth = customerAuth;

  // req.auth = best available (staff > customer)
  req.auth = staffAuth ?? customerAuth;

  next();
}

/**
 * requireRole — Reject requests that don't have the required role.
 * Manager implicitly has access to everything.
 */
export function requireRole(...roles: AuthRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    // Manager has universal access
    if (req.auth.role === "manager") return next();

    if (!roles.includes(req.auth.role)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    next();
  };
}

/**
 * requireTable — For customer routes, verify the JWT's tableId matches
 * the requested table AND that the pinVersion is still current.
 * Prevents table-hopping and invalidates sessions when PIN is changed.
 */
export async function requireTable(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.auth) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  // Manager and kitchen can access any table
  if (req.auth.role === "manager" || req.auth.role === "kitchen") {
    return next();
  }

  // Customer must match their table
  const requestedTableId = Number(req.params.tableId);
  if (req.auth.tableId !== requestedTableId) {
    res.status(403).json({ error: "Access denied — you can only access your assigned table" });
    return;
  }

  // Check pinVersion — if the manager randomized the PIN, the session is invalid
  if (req.auth.pinVersion !== undefined) {
    const { query } = await import("../db/connection.js");
    const rows = await query<{ pin_version: number }>(
      "SELECT pin_version FROM tables_config WHERE id = ?",
      [requestedTableId]
    );

    if (rows.length > 0 && rows[0].pin_version !== req.auth.pinVersion) {
      res.status(401).json({ error: "Session expired — PIN has been changed" });
      return;
    }
  }

  next();
}
