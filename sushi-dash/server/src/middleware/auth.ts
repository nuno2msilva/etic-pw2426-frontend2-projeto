/**
 * middleware/auth.ts — JWT authentication & authorisation
 *
 * Auth model (Email + Password):
 *   - Customer: authenticates with a per-table 4-digit PIN → JWT locked to that tableId
 *   - Staff: authenticates with email + password:
 *     • kitchen@sushidash.dev (password) → processes orders
 *     • manager@sushidash.dev (password) → manages menu/tables
 *     • admin@sushidash.dev (password) → manages users/permissions + all manager tasks
 *
 * Permissions (hierarchical):
 *   kitchen < manager < admin
 *   - kitchen: Can only process orders (view all, update status, cancel)
 *   - manager: kitchen + menu/table/settings management
 *   - admin: manager + user & permission management (ONLY, no kitchen/manager tasks)
 *
 * The JWT is stored in an httpOnly cookie so the browser sends it automatically.
 * The token contains { role, userId?, permission?, tableId?, pinVersion?, jti, iat, exp }.
 *
 * Passwords are hashed with bcrypt (cost=10) for security against brute force attacks.
 */

import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

/** Resolved lazily so module loading never throws */
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    console.warn("⚠️  JWT_SECRET is not set — using insecure fallback. Set it in Vercel env vars!");
  }
  return secret ?? "sushi-dash-dev-secret-change-me";
}
const TOKEN_EXPIRY = "8h";

/**
 * Two cookies allow a user to be logged in as customer AND staff
 * simultaneously (e.g. testing in the same browser).
 */
const COOKIE_CUSTOMER = "sushi_customer";
const COOKIE_STAFF    = "sushi_staff";

// ─── Types ────────────────────────────────────────────────────
export type AuthRole = "customer" | "kitchen" | "manager" | "admin";
export type Permission = "kitchen" | "manager" | "admin";

export interface TokenPayload {
  role: AuthRole;
  userId?: number;           // for staff sessions
  permission?: Permission;   // for staff sessions (kitchen/manager/admin)
  tableId?: number;          // for customer sessions
  pinVersion?: number;       // for customer sessions — invalidated when PIN changes
  jti: string;               // unique token ID for revocation
  issuedAt?: number;         // token iat (seconds since epoch)
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

/** Hash a password with bcrypt (cost=10) */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/** Verify password against bcrypt hash */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Create a signed JWT and set it as an httpOnly cookie */
export function issueToken(res: Response, payload: Omit<TokenPayload, "jti">): string {
  const jti = randomUUID();
  const token = jwt.sign({ ...payload, jti }, getJwtSecret(), {
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
      const decoded = jwt.verify(token, getJwtSecret()) as TokenPayload & jwt.JwtPayload;
      if (decoded.role !== "customer") {
        staffAuth = { 
          role: decoded.role, 
          userId: decoded.userId,
          permission: decoded.permission,
          tableId: decoded.tableId, 
          pinVersion: decoded.pinVersion, 
          jti: decoded.jti,
          issuedAt: typeof decoded.iat === "number" ? decoded.iat : undefined,
        };
      }
    } catch { /* expired / invalid */ }
  }

  // Decode customer token
  let customerAuth: TokenPayload | undefined;
  for (const token of [customerToken, legacyToken]) {
    if (!token || customerAuth) continue;
    try {
      const decoded = jwt.verify(token, getJwtSecret()) as TokenPayload & jwt.JwtPayload;
      if (decoded.role === "customer") {
        customerAuth = { 
          role: decoded.role, 
          tableId: decoded.tableId, 
          pinVersion: decoded.pinVersion, 
          jti: decoded.jti,
          issuedAt: typeof decoded.iat === "number" ? decoded.iat : undefined,
        };
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
 * Supports permission hierarchy: kitchen < manager < admin
 */
export function requireRole(...roles: AuthRole[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.auth) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    // For staff sessions, verify user is still active and not in forced-reset state.
    // This ensures live boot-out when admin disables account or resets password.
    if (req.auth.role !== "customer" && req.auth.userId) {
      try {
        const prisma = (await import("../db/prisma.js")).default;
        const user = await prisma.user.findUnique({
          where: { id: req.auth.userId },
          select: { isActive: true, passwordResetRequired: true, passwordPreview: true, permission: true },
        });

        // Invalidate when a reset is pending and a temporary password is still active.
        // This avoids timestamp precision races between JWT iat (seconds) and DB updatedAt (ms).
        const hasPendingResetWithTempPassword =
          user?.passwordResetRequired === true && !!user.passwordPreview;

        if (!user || !user.isActive || hasPendingResetWithTempPassword) {
          clearToken(res, req.auth.role);
          res.clearCookie("sushi_token", { path: "/" });
          res.status(401).json({ error: "Session expired. Please login again." });
          return;
        }

        req.auth.permission = user.permission;
      } catch {
        res.status(503).json({ error: "Authentication service unavailable" });
        return;
      }
    }

    // Create a set of all roles that satisfy the requirement
    const allowedRoles = new Set(roles);
    
    // Apply permission hierarchy:
    // - If admin is required, admin can do it
    // - If manager is required, manager or admin can do it
    // - If kitchen is required, kitchen, manager, or admin can do it
    
    const userRole = req.auth.role;
    const userPermission = req.auth.permission as Permission | undefined;
    const roleHierarchy: Record<Exclude<AuthRole, "customer">, number> = {
      kitchen: 1,
      manager: 2,
      admin: 3,
    };

    // Customer is never allowed in these contexts
    if (userRole === "customer") {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    // Check direct role match
    if (allowedRoles.has(userRole)) {
      return next();
    }

    // Legacy/session fallback: infer hierarchy from role even when permission is missing.
    const userRoleLevel = roleHierarchy[userRole];
    if (userRoleLevel > 0) {
      for (const role of roles) {
        if (role === "customer") continue;
        const requiredRoleLevel = roleHierarchy[role];
        if (userRoleLevel >= requiredRoleLevel) return next();
      }
    }

    // Check permission-based access (for staff users)
    if (userPermission) {
      // Create permission hierarchy
      const permissionHierarchy: Record<Permission, number> = {
        kitchen: 1,
        manager: 2,
        admin: 3,
      };

      const userLevel = permissionHierarchy[userPermission] ?? 0;

      // Check if user permission satisfies any required role
      for (const role of roles) {
        if (role === "kitchen" && userLevel >= 1) return next();
        if (role === "manager" && userLevel >= 2) return next();
        if (role === "admin" && userLevel >= 3) return next();
      }
    }

    res.status(403).json({ error: "Insufficient permissions" });
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

  // Manager (or higher) can access any table
  if (req.auth.role === "manager" || req.auth.role === "admin") {
    return next();
  }

  // Kitchen staff can access any table
  if (req.auth.role === "kitchen") {
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
    const prisma = (await import("../db/prisma.js")).default;
    const table = await prisma.tableConfig.findUnique({
      where: { id: requestedTableId },
      select: { pinVersion: true },
    });

    if (table && table.pinVersion !== req.auth.pinVersion) {
      res.status(401).json({ error: "Session expired — PIN has been changed" });
      return;
    }
  }

  next();
}
