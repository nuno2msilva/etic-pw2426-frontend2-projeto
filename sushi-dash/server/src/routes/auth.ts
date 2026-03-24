/**
 * routes/auth.ts — Authentication endpoints
 *
 * POST /api/auth/login/table/:tableId      — Customer login (PIN per table)
 * POST /api/auth/login/staff               — Staff login (username/email + password)
 * POST /api/auth/logout                    — Clear session
 * POST /api/auth/change-password           — Change own password (staff only)
 * GET  /api/auth/session                   — Check current session
 */

import { Router } from "express";
import prisma from "../db/prisma.js";
import { issueToken, clearToken, verifyPassword, hashPassword, authenticate } from "../middleware/auth.js";

const router = Router();

// ── Customer login (per-table PIN) ────────────────────────────
router.post("/login/table/:tableId", async (req, res) => {
  try {
    const tableId = Number(req.params.tableId);
    const { pin } = req.body as { pin?: string };

    if (!pin) {
      res.status(400).json({ error: "PIN required" });
      return;
    }

    const table = await prisma.tableConfig.findUnique({
      where: { id: tableId },
      select: { id: true, pin: true, pinVersion: true },
    });

    if (!table) {
      res.status(404).json({ error: "Table not found" });
      return;
    }

    if (pin !== table.pin) {
      res.status(401).json({ error: "Invalid PIN" });
      return;
    }

    // Include pinVersion so session is invalidated when manager randomizes PIN
    issueToken(res, { role: "customer", tableId, pinVersion: table.pinVersion });
    res.json({ success: true, role: "customer", tableId });
  } catch (err) {
    console.error("Customer login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Staff login (username/email + password) ───────────────────
// Supports kitchen, manager, and admin users
router.post("/login/staff", async (req, res) => {
  try {
    const { identifier, password } = req.body as { identifier?: string; password?: string };

    if (!identifier || !password) {
      res.status(400).json({ error: "Username/email and password required" });
      return;
    }

    // Find user by username or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { username: identifier },
        ],
      },
      select: { id: true, email: true, username: true, passwordHash: true, permission: true, isActive: true, passwordResetRequired: true, skipPasswordResetReminder: true },
    });

    if (!user) {
      res.status(401).json({ error: "Invalid username/email or password" });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ error: "User account is disabled" });
      return;
    }

    // Verify password with bcrypt
    const passwordValid = await verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      res.status(401).json({ error: "Invalid username/email or password" });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordPreview: null, lastLoginAt: new Date() },
    });

    // Issue token with permission level
    issueToken(res, { 
      role: user.permission, 
      userId: user.id,
      permission: user.permission 
    });

    res.json({ 
      success: true, 
      role: user.permission, 
      userId: user.id,
      email: user.email,
      username: user.username,
      passwordResetRequired: user.passwordResetRequired,
      skipPasswordResetReminder: user.skipPasswordResetReminder
    });
  } catch (err) {
    console.error("Staff login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Logout ────────────────────────────────────────────────────
router.post("/logout", (req, res) => {
  // If a role is specified, only clear that cookie
  const { role } = req.body as { role?: string };
  if (role === "customer") {
    clearToken(res, "customer");
  } else if (role && ["kitchen", "manager", "admin"].includes(role)) {
    clearToken(res, role as any);
  } else {
    // No role specified — clear both
    clearToken(res);
  }
  // Also clear legacy single cookie
  res.clearCookie("sushi_token", { path: "/" });
  res.json({ success: true });
});

// ── Change own password (staff only) ──────────────────────────
router.post("/change-password", authenticate, async (req, res) => {
  try {
    // Must be a staff user (not customer)
    if (!req.auth || req.auth.role === "customer" || !req.auth.userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: "Current and new password required" });
      return;
    }

    if (newPassword.length < 8 || !/\d/.test(newPassword) || !/[A-Z]/.test(newPassword)) {
      res.status(400).json({ 
        error: "Password must be at least 8 characters and contain a number and uppercase letter" 
      });
      return;
    }

    // Fetch user
    const user = await prisma.user.findUnique({
      where: { id: req.auth.userId },
      select: { id: true, passwordHash: true, email: true },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Verify current password
    const currentValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!currentValid) {
      res.status(401).json({ error: "Current password is incorrect" });
      return;
    }

    // Hash new password
    const newHash = await hashPassword(newPassword);

    // Update password and clear reset-reminder flags
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
        passwordPreview: null,
        passwordResetRequired: false,
        skipPasswordResetReminder: false,
      },
    });

    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Skip password reset reminder (staff only) ────────────────
router.post("/skip-password-reset-reminder", authenticate, async (req, res) => {
  try {
    if (!req.auth || req.auth.role === "customer" || !req.auth.userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    await prisma.user.update({
      where: { id: req.auth.userId },
      data: { skipPasswordResetReminder: true },
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Skip reminder error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Session check ─────────────────────────────────────────────
router.get("/session", async (req, res) => {
  // Return info about all active sessions
  const sessions: { role: string; userId?: number; email?: string; username?: string | null; tableId?: number | null; authenticated: boolean }[] = [];

  // Check staff session
  if (req.staffAuth) {
    // Fetch user email if available
    let email: string | undefined;
    let username: string | null | undefined;
    if (req.staffAuth.userId) {
      const user = await prisma.user.findUnique({
        where: { id: req.staffAuth.userId },
        select: { email: true, username: true, isActive: true, passwordResetRequired: true, permission: true, updatedAt: true },
      });
      const tokenIssuedAtMs = (req.staffAuth.issuedAt ?? 0) * 1000;
      const resetHappenedAfterToken =
        user?.passwordResetRequired === true && tokenIssuedAtMs > 0 && tokenIssuedAtMs < user.updatedAt.getTime();

      // Invalidate staff session if account is disabled/deleted, or reset happened after this token was issued.
      if (!user || !user.isActive || resetHappenedAfterToken) {
        clearToken(res, req.staffAuth.role);
        res.clearCookie("sushi_token", { path: "/" });
      } else {
        email = user.email;
        username = user.username;
      }
    }

    if (email || username) {
      sessions.push({
        role: req.staffAuth.role,
        userId: req.staffAuth.userId,
        email,
        username,
        authenticated: true
      });
    }
  }

  // Check customer session
  if (req.customerAuth) {
    // Verify PIN hasn't been changed
    const ca = req.customerAuth;
    if (ca.tableId && ca.pinVersion !== undefined) {
      try {
        const table = await prisma.tableConfig.findUnique({
          where: { id: ca.tableId },
          select: { pinVersion: true },
        });
        if (!table || table.pinVersion !== ca.pinVersion) {
          clearToken(res, "customer");
          // Customer session expired — don't include it
        } else {
          sessions.push({ role: "customer", tableId: ca.tableId, authenticated: true });
        }
      } catch {
        // DB error — treat as invalid
      }
    } else {
      sessions.push({ role: "customer", tableId: ca.tableId ?? null, authenticated: true });
    }
  }

  if (sessions.length === 0) {
    res.json({ authenticated: false });
    return;
  }

  // For backwards compat, also return the primary session at top level
  const primary = sessions.find(s => s.role !== "customer") ?? sessions[0];
  res.json({
    authenticated: true,
    role: primary.role,
    userId: primary.userId ?? null,
    email: primary.email,
    username: primary.username ?? null,
    tableId: primary.tableId ?? null,
    sessions,
  });
});

export default router;
