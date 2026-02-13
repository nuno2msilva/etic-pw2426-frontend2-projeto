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
import { query, execute } from "../db/connection.js";
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
      const rows = await query<{ id: number; label: string; pin: string; pin_version: number }>(
        "SELECT id, label, pin, pin_version FROM tables_config ORDER BY id"
      );
      res.json(rows);
    } else {
      const rows = await query<{ id: number; label: string }>(
        "SELECT id, label FROM tables_config ORDER BY id"
      );
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

    const result = await execute(
      "INSERT INTO tables_config (label, pin, pin_version) VALUES (?, ?, 1)",
      [label, tablePin]
    );

    const id = Number(result.insertId);
    broadcast({ type: "table-added", tableId: id });
    res.status(201).json({ id, label, pin: tablePin, pin_version: 1 });
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

    const result = await execute(
      "UPDATE tables_config SET label = ? WHERE id = ?",
      [label, id]
    );

    if (result.affectedRows === 0) {
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
    const result = await execute("DELETE FROM tables_config WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
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
// Bumps pin_version → customer sessions for this table are invalidated
router.put("/:id/pin", requireRole("manager"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { pin } = req.body as { pin?: string };

    if (!pin || !/^\d{4}$/.test(pin)) {
      res.status(400).json({ error: "PIN must be exactly 4 digits" });
      return;
    }

    const result = await execute(
      "UPDATE tables_config SET pin = ?, pin_version = pin_version + 1 WHERE id = ?",
      [pin, id]
    );

    if (result.affectedRows === 0) {
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
// Bumps pin_version → all existing customer sessions for this table are invalidated
router.post("/:id/pin/randomize", requireRole("manager"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const newPin = generatePin();

    const result = await execute(
      "UPDATE tables_config SET pin = ?, pin_version = pin_version + 1 WHERE id = ?",
      [newPin, id]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ error: "Table not found" });
      return;
    }

    // Get the new pin_version
    const rows = await query<{ pin_version: number }>(
      "SELECT pin_version FROM tables_config WHERE id = ?",
      [id]
    );

    broadcast({ type: "pin-changed", tableId: id });
    res.json({ success: true, pin: newPin, pin_version: rows[0].pin_version });
  } catch (err) {
    console.error("Table PIN randomize error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
