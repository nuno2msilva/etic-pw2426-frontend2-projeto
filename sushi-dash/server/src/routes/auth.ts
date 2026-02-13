/**
 * routes/auth.ts — Authentication endpoints
 *
 * POST /api/auth/login/table/:tableId  — Customer login (password per table)
 * POST /api/auth/login/kitchen         — Kitchen staff login
 * POST /api/auth/login/manager         — Manager login
 * POST /api/auth/logout                — Clear session
 * GET  /api/auth/session               — Check current session
 */

import { Router } from "express";
import prisma from "../db/prisma.js";
import { hashPassword, issueToken, clearToken } from "../middleware/auth.js";

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

// ── Kitchen login ─────────────────────────────────────────────
router.post("/login/kitchen", async (req, res) => {
  try {
    const { password } = req.body as { password?: string };

    if (!password) {
      res.status(400).json({ error: "Password required" });
      return;
    }

    const row = await prisma.password.findUnique({
      where: { role: "kitchen" },
    });

    if (!row) {
      res.status(500).json({ error: "Kitchen password not configured" });
      return;
    }

    const hash = hashPassword(password);
    if (hash !== row.passwordHash) {
      res.status(401).json({ error: "Invalid password" });
      return;
    }

    issueToken(res, { role: "kitchen" });
    res.json({ success: true, role: "kitchen" });
  } catch (err) {
    console.error("Kitchen login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Manager login ─────────────────────────────────────────────
router.post("/login/manager", async (req, res) => {
  try {
    const { password } = req.body as { password?: string };

    if (!password) {
      res.status(400).json({ error: "Password required" });
      return;
    }

    const row = await prisma.password.findUnique({
      where: { role: "manager" },
    });

    if (!row) {
      res.status(500).json({ error: "Manager password not configured" });
      return;
    }

    const hash = hashPassword(password);
    if (hash !== row.passwordHash) {
      res.status(401).json({ error: "Invalid password" });
      return;
    }

    issueToken(res, { role: "manager" });
    res.json({ success: true, role: "manager" });
  } catch (err) {
    console.error("Manager login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Logout ────────────────────────────────────────────────────
router.post("/logout", (req, res) => {
  // If a role is specified, only clear that cookie
  const { role } = req.body as { role?: string };
  if (role === "customer") {
    clearToken(res, "customer");
  } else if (role === "kitchen" || role === "manager") {
    clearToken(res, role);
  } else {
    // No role specified — clear both
    clearToken(res);
  }
  // Also clear legacy single cookie
  res.clearCookie("sushi_token", { path: "/" });
  res.json({ success: true });
});

// ── Session check ─────────────────────────────────────────────
router.get("/session", async (req, res) => {
  // Return info about all active sessions
  const sessions: { role: string; tableId?: number | null; authenticated: boolean }[] = [];

  // Check staff session
  if (req.staffAuth) {
    sessions.push({ role: req.staffAuth.role, authenticated: true });
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
    tableId: primary.tableId ?? null,
    sessions,
  });
});

export default router;
