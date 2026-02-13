/**
 * routes/menu.ts — Menu / item endpoints
 *
 * GET    /api/menu                    — List all items (customers only see available)
 * POST   /api/menu                    — Add item (manager) — auto-assigns ID
 * PUT    /api/menu/:id                — Update item (manager)
 * PATCH  /api/menu/:id/availability   — Toggle item availability (manager)
 * DELETE /api/menu/:id                — Delete item (manager)
 */

import { Router } from "express";
import { query, execute } from "../db/connection.js";
import { requireRole } from "../middleware/auth.js";
import { broadcast } from "../events.js";

const router = Router();

interface ItemRow {
  id: number;
  name: string;
  emoji: string;
  category_id: number;
  is_popular: boolean;
  is_available: boolean;
  category_name: string;
}

// ── List all items with categories ────────────────────────────
// Customers only see available items; empty categories are hidden for them.
// Manager/kitchen see everything (including unavailable items).
router.get("/", async (req, res) => {
  try {
    const isCustomer = !req.auth || req.auth.role === "customer";

    // Fetch items — filter by availability for customers
    const itemsSql = isCustomer
      ? `SELECT i.id, i.name, i.emoji, i.category_id, i.is_popular, i.is_available, c.name AS category_name
         FROM items i
         JOIN categories c ON c.id = i.category_id
         WHERE i.is_available = TRUE
         ORDER BY c.sort_order, i.id`
      : `SELECT i.id, i.name, i.emoji, i.category_id, i.is_popular, i.is_available, c.name AS category_name
         FROM items i
         JOIN categories c ON c.id = i.category_id
         ORDER BY c.sort_order, i.id`;

    const items = await query<ItemRow>(itemsSql);

    // For customers, only include categories that have at least one available item
    const allCategories = await query<{ id: number; name: string; sort_order: number }>(
      "SELECT id, name, sort_order FROM categories ORDER BY sort_order"
    );

    const categories = isCustomer
      ? allCategories.filter((cat) => items.some((item) => item.category_id === cat.id))
      : allCategories;

    res.json({ categories, items });
  } catch (err) {
    console.error("Menu fetch error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Add item (manager only) ──────────────────────────────────
// ID is auto-assigned by the database.
router.post("/", requireRole("manager"), async (req, res) => {
  try {
    const { name, emoji, category_id, is_popular } = req.body as {
      name?: string;
      emoji?: string;
      category_id?: number;
      is_popular?: boolean;
    };

    if (!name || !emoji || !category_id) {
      res.status(400).json({ error: "name, emoji, and category_id are required" });
      return;
    }

    // Verify category exists
    const cats = await query<{ id: number }>(
      "SELECT id FROM categories WHERE id = ?",
      [category_id]
    );
    if (cats.length === 0) {
      res.status(400).json({ error: "Category not found — create the category first" });
      return;
    }

    const result = await execute(
      "INSERT INTO items (name, emoji, category_id, is_popular) VALUES (?, ?, ?, ?)",
      [name, emoji, category_id, is_popular ?? false]
    );

    const id = Number(result.insertId);
    broadcast({ type: "menu-changed" });
    res.status(201).json({ id, name, emoji, category_id, is_popular: is_popular ?? false, is_available: true });
  } catch (err) {
    console.error("Menu add error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Update item (manager only) ───────────────────────────────
router.put("/:id", requireRole("manager"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, emoji, category_id, is_popular } = req.body as {
      name?: string;
      emoji?: string;
      category_id?: number;
      is_popular?: boolean;
    };

    const fields: string[] = [];
    const values: unknown[] = [];

    if (name !== undefined) { fields.push("name = ?"); values.push(name); }
    if (emoji !== undefined) { fields.push("emoji = ?"); values.push(emoji); }
    if (category_id !== undefined) { fields.push("category_id = ?"); values.push(category_id); }
    if (is_popular !== undefined) { fields.push("is_popular = ?"); values.push(is_popular); }

    if (fields.length === 0) {
      res.status(400).json({ error: "No fields to update" });
      return;
    }

    values.push(id);
    const result = await execute(
      `UPDATE items SET ${fields.join(", ")} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ error: "Item not found" });
      return;
    }

    broadcast({ type: "menu-changed" });
    res.json({ success: true, id });
  } catch (err) {
    console.error("Menu update error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Toggle availability (manager only) ──────────────────────
router.patch("/:id/availability", requireRole("manager"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { is_available } = req.body as { is_available?: boolean };

    if (is_available === undefined) {
      res.status(400).json({ error: "is_available is required" });
      return;
    }

    const result = await execute(
      "UPDATE items SET is_available = ? WHERE id = ?",
      [is_available, id]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ error: "Item not found" });
      return;
    }

    broadcast({ type: "menu-changed" });
    res.json({ success: true, id, is_available });
  } catch (err) {
    console.error("Availability toggle error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Delete item (manager only) ──────────────────────────────
router.delete("/:id", requireRole("manager"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const result = await execute("DELETE FROM items WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      res.status(404).json({ error: "Item not found" });
      return;
    }

    broadcast({ type: "menu-changed" });
    res.json({ success: true });
  } catch (err) {
    console.error("Menu delete error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
