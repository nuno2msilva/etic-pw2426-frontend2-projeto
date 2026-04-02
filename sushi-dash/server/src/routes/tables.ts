/**
 * routes/tables.ts — Table management endpoints
 *
 * GET    /api/tables                  — List all tables (manager sees PINs)
 * POST   /api/tables                  — Add table (manager)
 * PUT    /api/tables/:id              — Update table (manager)
 * DELETE /api/tables/:id              — Delete table (manager)
 * PUT    /api/tables/:id/pin          — Set table PIN manually (manager)
 * POST   /api/tables/:id/pin/randomize — Randomize table PIN (manager) — invalidates sessions
 */

import { Router } from "express";
import prisma from "../db/prisma";
import { requireRole } from "../middleware/auth";
import { broadcast, disconnectCustomerConnectionsByTableId, getPresence } from "../events";

const router = Router();

/** Generate a random 4-digit PIN */
function generatePin(): string {
  return String(Math.floor(Math.random() * 10000)).padStart(4, "0");
}

/** How recently a heartbeat must have been to count as "present" */
const PRESENCE_STALENESS_MS = 2 * 60 * 1000; // 2 minutes

// ── Current table presence snapshot (public) ────────────────
// Merges in-memory SSE presence with database-backed per-session heartbeats
// so the indicator works reliably on Vercel serverless.
router.get("/presence", async (_req, res) => {
  const memoryPresence = getPresence();

  try {
    const cutoff = new Date(Date.now() - PRESENCE_STALENESS_MS);

    // Count distinct active sessions per table (not a single flag)
    const activeRows = await prisma.customerPresence.groupBy({
      by: ["tableId"],
      where: { lastHeartbeatAt: { gte: cutoff } },
      _count: { id: true },
    });

    // Merge: take the max of in-memory SSE count and DB session count
    const merged: Record<number, number> = { ...memoryPresence };
    for (const row of activeRows) {
      const dbCount = row._count.id;
      merged[row.tableId] = Math.max(merged[row.tableId] ?? 0, dbCount);
    }

    res.json({ presence: merged });
  } catch {
    // Fallback to in-memory only if DB is unreachable
    res.json({ presence: memoryPresence });
  }
});

// ── Customer heartbeat (updates DB-backed per-session presence) ──
// Each customer session gets its own row, so multiple customers
// at the same table don't clobber each other's presence.
router.post("/:id/heartbeat", async (req, res) => {
  const id = Number(req.params.id);

  // Only allow the authenticated customer for this table
  if (!req.customerAuth || req.customerAuth.tableId !== id) {
    res.status(403).json({ error: "Not authorized for this table" });
    return;
  }

  const jti = req.customerAuth.jti;
  if (!jti) {
    res.status(400).json({ error: "Missing session token" });
    return;
  }

  try {
    await prisma.customerPresence.upsert({
      where: { sessionToken: jti },
      update: { lastHeartbeatAt: new Date() },
      create: { tableId: id, sessionToken: jti, lastHeartbeatAt: new Date() },
    });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Clear customer presence from a table (called on logout/leave) ──
// Only removes the current session's row; other customers at the
// same table keep their presence.
router.delete("/:id/heartbeat", async (req, res) => {
  const id = Number(req.params.id);
  const jti = req.customerAuth?.jti;

  try {
    if (jti) {
      // Delete only this session's presence row
      await prisma.customerPresence.deleteMany({
        where: { sessionToken: jti, tableId: id },
      });
    }
    // If no jti (expired cookie), still return success — best-effort cleanup
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── List all tables ──────────────────────────────────────────
// Manager sees PINs in plaintext; everyone else just gets id + label
router.get("/", async (req, res) => {
  try {
    const isManager = req.auth?.role === "manager";

    if (isManager) {
      const rows = await prisma.tableConfig.findMany({
        where: { isActive: true },
        orderBy: { id: "asc" },
      });
      res.json(rows.map((r) => ({ id: r.id, label: r.label, pin: r.pin, pin_version: r.pinVersion })));
    } else {
      const rows = await prisma.tableConfig.findMany({
        where: { isActive: true },
        select: { id: true, label: true },
        orderBy: { id: "asc" },
      });
      res.json(rows);
    }
  } catch (err) {
    console.error("Tables fetch error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Add table (manager only) ─────────────────────────────────
router.post("/", requireRole("manager"), async (req, res) => {
  try {
    const { label, pin } = req.body as { label?: string; pin?: string };

    if (!label) {
      res.status(400).json({ error: "label is required" });
      return;
    }

    const tablePin = pin && /^\d{4}$/.test(pin) ? pin : generatePin();

    const table = await prisma.tableConfig.create({
      data: { label, pin: tablePin, pinVersion: 1, isActive: true },
    });

    broadcast({ type: "table-added", tableId: table.id });
    res.status(201).json({ id: table.id, label: table.label, pin: table.pin, pin_version: table.pinVersion });
  } catch (err) {
    console.error("Table add error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Update table label (manager only) ────────────────────────
router.put("/:id", requireRole("manager"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { label } = req.body as { label?: string };

    if (!label) {
      res.status(400).json({ error: "label is required" });
      return;
    }

    const updated = await prisma.tableConfig.updateMany({
      where: { id, isActive: true },
      data: { label },
    });

    if (updated.count === 0) {
      res.status(404).json({ error: "Table not found" });
      return;
    }

    broadcast({ type: "table-updated", tableId: id });
    res.json({ success: true, id, label });
  } catch (err) {
    console.error("Table update error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Delete table (manager only) ──────────────────────────────
router.delete("/:id", requireRole("manager"), async (req, res) => {
  try {
    const id = Number(req.params.id);

    // Soft-delete table to preserve historical orders and non-reusable IDs.
    const deleted = await prisma.tableConfig.updateMany({
      where: { id, isActive: true },
      data: { isActive: false },
    });

    if (deleted.count === 0) {
      res.status(404).json({ error: "Table not found" });
      return;
    }

    // Evict presence rows and SSE connections for deleted table
    await prisma.customerPresence.deleteMany({ where: { tableId: id } }).catch(() => {});
    broadcast({ type: "table-deleted", tableId: id });
    disconnectCustomerConnectionsByTableId(id);
    res.json({ success: true });
  } catch (err) {
    console.error("Table delete error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Set table PIN manually (manager only) ────────────────────
// Bumps pinVersion → customer sessions for this table are invalidated
router.put("/:id/pin", requireRole("manager"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { pin } = req.body as { pin?: string };

    if (!pin || !/^\d{4}$/.test(pin)) {
      res.status(400).json({ error: "PIN must be exactly 4 digits" });
      return;
    }

    const updated = await prisma.tableConfig.updateMany({
      where: { id, isActive: true },
      data: { pin, pinVersion: { increment: 1 } },
    });

    if (updated.count === 0) {
      res.status(404).json({ error: "Table not found" });
      return;
    }

    // Evict all customer presence rows — PIN changed, sessions invalidated
    await prisma.customerPresence.deleteMany({ where: { tableId: id } }).catch(() => {});

    broadcast({ type: "pin-changed", tableId: id });
    // Force-close SSE connections so in-memory presence clears immediately
    disconnectCustomerConnectionsByTableId(id);
    res.json({ success: true, pin });
  } catch (err) {
    console.error("Table PIN update error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Randomize table PIN (manager only) ───────────────────────
// Bumps pinVersion → all existing customer sessions for this table are invalidated
router.post("/:id/pin/randomize", requireRole("manager"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const newPin = generatePin();

    const existing = await prisma.tableConfig.findFirst({
      where: { id, isActive: true },
      select: { id: true },
    });

    if (!existing) {
      res.status(404).json({ error: "Table not found" });
      return;
    }

    const updated = await prisma.tableConfig.update({
      where: { id },
      data: { pin: newPin, pinVersion: { increment: 1 } },
    });

    // Evict all customer presence rows — PIN randomized, sessions invalidated
    await prisma.customerPresence.deleteMany({ where: { tableId: id } }).catch(() => {});

    broadcast({ type: "pin-changed", tableId: id });
    // Force-close SSE connections so in-memory presence clears immediately
    disconnectCustomerConnectionsByTableId(id);
    res.json({ success: true, pin: newPin, pin_version: updated.pinVersion });
  } catch (err) {
    console.error("Table PIN randomize error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
