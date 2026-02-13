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
import prisma from "../db/prisma.js";
import { requireRole } from "../middleware/auth.js";
import { broadcast } from "../events.js";

const router = Router();

/** Generate a random 4-digit PIN */
function generatePin(): string {
  return String(Math.floor(Math.random() * 10000)).padStart(4, "0");
}

// ── List all tables ──────────────────────────────────────────
// Manager sees PINs in plaintext; everyone else just gets id + label
router.get("/", async (req, res) => {
  try {
    const isManager = req.auth?.role === "manager";

    if (isManager) {
      const rows = await prisma.tableConfig.findMany({ orderBy: { id: "asc" } });
      res.json(rows.map((r) => ({ id: r.id, label: r.label, pin: r.pin, pin_version: r.pinVersion })));
    } else {
      const rows = await prisma.tableConfig.findMany({
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
      data: { label, pin: tablePin, pinVersion: 1 },
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

    const updated = await prisma.tableConfig.update({
      where: { id },
      data: { label },
    }).catch((e: any) => {
      if (e.code === "P2025") return null;
      throw e;
    });

    if (!updated) {
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

    const deleted = await prisma.tableConfig.delete({ where: { id } }).catch((e: any) => {
      if (e.code === "P2025") return null;
      throw e;
    });

    if (!deleted) {
      res.status(404).json({ error: "Table not found" });
      return;
    }

    broadcast({ type: "table-deleted", tableId: id });
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

    const updated = await prisma.tableConfig.update({
      where: { id },
      data: { pin, pinVersion: { increment: 1 } },
    }).catch((e: any) => {
      if (e.code === "P2025") return null;
      throw e;
    });

    if (!updated) {
      res.status(404).json({ error: "Table not found" });
      return;
    }

    broadcast({ type: "pin-changed", tableId: id });
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

    const updated = await prisma.tableConfig.update({
      where: { id },
      data: { pin: newPin, pinVersion: { increment: 1 } },
    }).catch((e: any) => {
      if (e.code === "P2025") return null;
      throw e;
    });

    if (!updated) {
      res.status(404).json({ error: "Table not found" });
      return;
    }

    broadcast({ type: "pin-changed", tableId: id });
    res.json({ success: true, pin: newPin, pin_version: updated.pinVersion });
  } catch (err) {
    console.error("Table PIN randomize error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
