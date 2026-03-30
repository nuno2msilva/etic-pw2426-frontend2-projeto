/**
 * routes/users.ts — User management endpoints (admin only)
 *
 * GET    /api/users                      — List all users (admin)
 * POST   /api/users                      — Create new user (admin)
 * PUT    /api/users/:id                  — Update user (admin)
 * DELETE /api/users/:id                  — Delete user (admin)
 * PATCH  /api/users/:id/disable          — Disable user (admin)
 * PATCH  /api/users/:id/enable           — Enable user (admin)
 */

import { Router } from "express";
import { randomInt } from "crypto";
import prisma from "../db/prisma";
import { requireRole, hashPassword } from "../middleware/auth";
import type { Permission } from "../middleware/auth";

const router = Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_\-.]{3,32}$/;

// Password validation helper
function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: "Password must be at least 8 characters" };
  }
  if (!/\d/.test(password)) {
    return { valid: false, error: "Password must contain at least one number" };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: "Password must contain at least one uppercase letter" };
  }
  return { valid: true };
}

function randomChar(charset: string): string {
  return charset[randomInt(charset.length)];
}

function generateRandomPassword(length = 12): string {
  // Readable temporary format: CvcCvc-2345 (no confusing chars like 0/O, 1/l/I)
  const consonants = "bcdfghjkmnpqrstvwxyz";
  const vowels = "aeu";
  const digits = "23456789";

  const syllable = () =>
    `${randomChar(consonants)}${randomChar(vowels)}${randomChar(consonants)}`;

  const firstWord = (() => {
    const base = syllable();
    return `${base[0].toUpperCase()}${base.slice(1)}`;
  })();
  const secondWord = syllable();
  const code = Array.from({ length: 4 }, () => randomChar(digits)).join("");

  const candidate = `${firstWord}${secondWord}-${code}`;

  if (candidate.length >= Math.max(length, 8) && validatePassword(candidate).valid) {
    return candidate;
  }

  // Safety fallback in the unlikely case validation rules change later.
  return `${firstWord}${secondWord}${randomChar("ABCDEFGHJKLMNPQRSTUVWXYZ")}-${code}`;
}

// ── List all users (admin only) ──────────────────────────────
router.get("/", requireRole("admin"), async (_req, res) => {
  try {
    const usersRaw = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        passwordPreview: true,
        permission: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      } as any,
      orderBy: { createdAt: "asc" },
    });

    const users = usersRaw as any[];

    res.json({
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        username: u.username,
        passwordPreview: u.passwordPreview,
        permission: u.permission,
        isActive: u.isActive,
        lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error("List users error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Create new user (admin only) ─────────────────────────────
router.post("/", requireRole("admin"), async (req, res) => {
  try {
    const { email, username, permission } = req.body as {
      email?: string;
      username?: string;
      permission?: Permission;
    };

    if (!email || !username || !permission) {
      res.status(400).json({ error: "Username, email, and permission are required" });
      return;
    }

    // Validate email format
    if (!EMAIL_REGEX.test(email)) {
      res.status(400).json({ error: "Invalid email format" });
      return;
    }

    if (!USERNAME_REGEX.test(username)) {
      res.status(400).json({ error: "Username must be 3-32 chars and use letters, numbers, dot, dash, or underscore" });
      return;
    }

    // Single-admin policy: new users can only be kitchen or manager.
    if (!["kitchen", "manager"].includes(permission)) {
      res.status(400).json({ error: "Permission must be one of: kitchen, manager" });
      return;
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: "Email already in use" });
      return;
    }

    const existingUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUsername) {
      res.status(409).json({ error: "Username already in use" });
      return;
    }

    const generatedPassword = generateRandomPassword();
    const passwordHash = await hashPassword(generatedPassword);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        passwordPreview: generatedPassword,
        permission,
        isActive: true,
        passwordResetRequired: true,
        skipPasswordResetReminder: false,
      },
      select: { id: true, email: true, username: true, passwordPreview: true, permission: true, isActive: true, createdAt: true },
    });

    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        passwordPreview: user.passwordPreview,
        permission: user.permission,
        isActive: user.isActive,
        createdAt: user.createdAt.toISOString(),
      },
    });
  } catch (err) {
    console.error("Create user error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Update user (admin only) ─────────────────────────────────
router.put("/:id", requireRole("admin"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { email, username, permission } = req.body as {
      email?: string;
      username?: string;
      permission?: Permission;
    };

    const currentUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, permission: true },
    });

    if (!currentUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Validate permission if provided
    if (permission && !["kitchen", "manager", "admin"].includes(permission)) {
      res.status(400).json({ error: "Permission must be one of: kitchen, manager, admin" });
      return;
    }

    if (permission) {
      if (currentUser.permission === "admin" && permission !== "admin") {
        res.status(403).json({ error: "Admin permission cannot be changed" });
        return;
      }
      if (currentUser.permission !== "admin" && permission === "admin") {
        res.status(403).json({ error: "Only the existing admin account can be admin" });
        return;
      }
    }

    // Check if email is being changed and if it's already in use
    if (email) {
      if (!EMAIL_REGEX.test(email)) {
        res.status(400).json({ error: "Invalid email format" });
        return;
      }

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing && existing.id !== id) {
        res.status(409).json({ error: "Email already in use" });
        return;
      }
    }

    if (username) {
      if (!USERNAME_REGEX.test(username)) {
        res.status(400).json({ error: "Username must be 3-32 chars and use letters, numbers, dot, dash, or underscore" });
        return;
      }

      const existing = await prisma.user.findUnique({ where: { username } });
      if (existing && existing.id !== id) {
        res.status(409).json({ error: "Username already in use" });
        return;
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(email && { email }),
        ...(username && { username }),
        ...(permission && { permission }),
      },
      select: { id: true, email: true, username: true, permission: true, isActive: true, updatedAt: true },
    }).catch((e: any) => {
      if (e.code === "P2025") return null; // User not found
      throw e;
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({
      success: true,
      user: {
        ...user,
        updatedAt: user.updatedAt.toISOString(),
      },
    });
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Delete user (admin only) ─────────────────────────────────
router.delete("/:id", requireRole("admin"), async (req, res) => {
  try {
    const id = Number(req.params.id);

    // Prevent deleting the admin user
    const user = await prisma.user.findUnique({ where: { id }, select: { permission: true } });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (user.permission === "admin") {
      res.status(403).json({ error: "Cannot delete the admin user" });
      return;
    }

    await prisma.user.delete({ where: { id } });

    res.json({ success: true });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Disable user (admin only) ────────────────────────────────
router.patch("/:id/disable", requireRole("admin"), async (req, res) => {
  try {
    const id = Number(req.params.id);

    // Prevent disabling the admin user
    const user = await prisma.user.findUnique({ where: { id }, select: { permission: true } });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (user.permission === "admin") {
      res.status(403).json({ error: "Cannot disable the admin user" });
      return;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, email: true, isActive: true },
    });

    res.json({ success: true, user: updated });
  } catch (err) {
    console.error("Disable user error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Enable user (admin only) ─────────────────────────────────
router.patch("/:id/enable", requireRole("admin"), async (req, res) => {
  try {
    const id = Number(req.params.id);

    const user = await prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: true },
      select: { id: true, email: true, isActive: true },
    });

    res.json({ success: true, user: updated });
  } catch (err) {
    console.error("Enable user error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Reset user password (admin only) ─────────────────────────
router.patch("/:id/reset-password", requireRole("admin"), async (req, res) => {
  try {
    const id = Number(req.params.id);

    const user = await prisma.user.findUnique({ where: { id }, select: { email: true } });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const generatedPassword = generateRandomPassword();
    const passwordHash = await hashPassword(generatedPassword);
    const updated = await prisma.user.update({
      where: { id },
      data: {
        passwordHash,
        passwordPreview: generatedPassword,
        passwordResetRequired: true,
        skipPasswordResetReminder: false,
      },
      select: { id: true, email: true, passwordPreview: true, passwordResetRequired: true, skipPasswordResetReminder: true },
    });

    res.json({
      success: true,
      message: `Password reset for ${user.email}. User must change password on next login.`,
      user: updated,
    });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
