/**
 * routes/categories.ts — Category management endpoints
 *
 * GET    /api/categories           — List all categories
 * POST   /api/categories           — Add category (manager)
 * PUT    /api/categories/:id       — Update category (manager)
 * DELETE /api/categories/:id       — Delete category (manager)
 */

import { Router } from "express";
import { query, execute } from "../db/connection.js";
import { requireRole } from "../middleware/auth.js";
import { broadcast } from "../events.js";

const router = Router();

// ── List all categories ──────────────────────────────────────
router.get("/", async (_req, res) => {
  try {
    const rows = await query<{ id: number; name: string; sort_order: number }>(
      "SELECT id, name, sort_order FROM categories ORDER BY sort_order, id"
    );
    res.json(rows);
  } catch (err) {
    console.error("Categories fetch error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Add category (manager only) ─────────────────────────────
router.post("/", requireRole("manager"), async (req, res) => {
  try {
    const { name } = req.body as { name?: string };

    if (!name) {
      res.status(400).json({ error: "name is required" });
      return;
    }

    // Auto-assign sort_order as max + 1
    const maxRow = await query<{ max_order: number | null }>(
      "SELECT MAX(sort_order) AS max_order FROM categories"
    );
    const nextOrder = (maxRow[0]?.max_order ?? 0) + 1;

    const result = await execute(
      "INSERT INTO categories (name, sort_order) VALUES (?, ?)",
      [name, nextOrder]
    );

    const id = Number(result.insertId);
    broadcast({ type: "menu-changed" });
    res.status(201).json({ id, name, sort_order: nextOrder });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "23505") {
      res.status(409).json({ error: "Category already exists" });
      return;
    }
    console.error("Category add error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Update category (manager only) ──────────────────────────
router.put("/:id", requireRole("manager"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, sort_order } = req.body as { name?: string; sort_order?: number };

    const fields: string[] = [];
    const values: unknown[] = [];

    if (name !== undefined) { fields.push("name = ?"); values.push(name); }
    if (sort_order !== undefined) { fields.push("sort_order = ?"); values.push(sort_order); }

    if (fields.length === 0) {
      res.status(400).json({ error: "No fields to update" });
      return;
    }

    values.push(id);
    const result = await execute(
      `UPDATE categories SET ${fields.join(", ")} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ error: "Category not found" });
      return;
    }

    broadcast({ type: "menu-changed" });
    res.json({ success: true, id });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "23505") {
      res.status(409).json({ error: "Category name already exists" });
      return;
    }
    console.error("Category update error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Delete category (manager only) ──────────────────────────
// Cascades to all items in the category
router.delete("/:id", requireRole("manager"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const result = await execute("DELETE FROM categories WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      res.status(404).json({ error: "Category not found" });
      return;
    }

    broadcast({ type: "menu-changed" });
    res.json({ success: true });
  } catch (err) {
    console.error("Category delete error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
