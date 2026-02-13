/**
 * routes/settings.ts — App settings endpoints
 *
 * GET /api/settings         — Read settings
 * PUT /api/settings         — Update settings (manager)
 */

import { Router } from "express";
import { query, execute } from "../db/connection.js";
import { requireRole } from "../middleware/auth.js";
import { broadcast } from "../events.js";

const router = Router();

// ── Read settings ────────────────────────────────────────────
router.get("/", async (_req, res) => {
  try {
    const rows = await query<{ key: string; value: string }>(
      'SELECT "key", value FROM settings'
    );
    const settings = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    res.json(settings);
  } catch (err) {
    console.error("Settings fetch error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Update settings (manager only) ──────────────────────────
router.put("/", requireRole("manager"), async (req, res) => {
  try {
    const updates = req.body as Record<string, string | number>;

    if (!updates || Object.keys(updates).length === 0) {
      res.status(400).json({ error: "No settings provided" });
      return;
    }

    for (const [key, value] of Object.entries(updates)) {
      await execute(
        'INSERT INTO settings ("key", value) VALUES (?, ?) ON CONFLICT ("key") DO UPDATE SET value = EXCLUDED.value',
        [key, String(value)]
      );
    }

    // Return updated settings
    const rows = await query<{ key: string; value: string }>(
      'SELECT "key", value FROM settings'
    );
    const settings = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    broadcast({ type: "settings-changed" });
    res.json(settings);
  } catch (err) {
    console.error("Settings update error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Update passwords (manager only) ─────────────────────────
router.put("/passwords", requireRole("manager"), async (req, res) => {
  try {
    const { role, password } = req.body as { role?: string; password?: string };

    if (!role || !password) {
      res.status(400).json({ error: "role and password are required" });
      return;
    }

    if (!["kitchen", "manager"].includes(role)) {
      res.status(400).json({ error: "role must be 'kitchen' or 'manager'" });
      return;
    }

    // Import hashPassword inline to avoid circular dep issues
    const { hashPassword } = await import("../middleware/auth.js");
    const hash = hashPassword(password);

    await execute(
      "UPDATE passwords SET password_hash = ? WHERE role = ?",
      [hash, role]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Password update error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
