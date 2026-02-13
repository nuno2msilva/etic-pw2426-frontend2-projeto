/**
 * routes/menu.ts — Menu / item endpoints (Prisma)
 *
 * GET    /api/menu                    — List all items (customers only see available)
 * POST   /api/menu                    — Add item (manager) — auto-assigns ID
 * PUT    /api/menu/:id                — Update item (manager)
 * PATCH  /api/menu/:id/availability   — Toggle item availability (manager)
 * DELETE /api/menu/:id                — Delete item (manager)
 */

import { Router } from "express";
import prisma from "../db/prisma.js";
import { requireRole } from "../middleware/auth.js";
import { broadcast } from "../events.js";

const router = Router();

// ── List all items with categories ────────────────────────────
router.get("/", async (req, res) => {
  try {
    const isCustomer = !req.auth || req.auth.role === "customer";

    const items = await prisma.item.findMany({
      where: isCustomer ? { isAvailable: true } : undefined,
      include: { category: { select: { name: true, sortOrder: true } } },
      orderBy: [{ category: { sortOrder: "asc" } }, { id: "asc" }],
    });

    const allCategories = await prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
    });

    // For customers, only include categories that have at least one available item
    const categories = isCustomer
      ? allCategories.filter(cat => items.some(item => item.categoryId === cat.id))
      : allCategories;

    res.json({
      categories: categories.map(c => ({ id: c.id, name: c.name, sort_order: c.sortOrder })),
      items: items.map(i => ({
        id: i.id,
        name: i.name,
        emoji: i.emoji,
        category_id: i.categoryId,
        is_popular: i.isPopular,
        is_available: i.isAvailable,
        category_name: i.category.name,
      })),
    });
  } catch (err) {
    console.error("Menu fetch error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Add item (manager only) ──────────────────────────────────
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
    const cat = await prisma.category.findUnique({ where: { id: category_id } });
    if (!cat) {
      res.status(400).json({ error: "Category not found — create the category first" });
      return;
    }

    const item = await prisma.item.create({
      data: { name, emoji, categoryId: category_id, isPopular: is_popular ?? false },
    });

    broadcast({ type: "menu-changed" });
    res.status(201).json({
      id: item.id,
      name: item.name,
      emoji: item.emoji,
      category_id: item.categoryId,
      is_popular: item.isPopular,
      is_available: item.isAvailable,
    });
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

    const data: { name?: string; emoji?: string; categoryId?: number; isPopular?: boolean } = {};
    if (name !== undefined) data.name = name;
    if (emoji !== undefined) data.emoji = emoji;
    if (category_id !== undefined) data.categoryId = category_id;
    if (is_popular !== undefined) data.isPopular = is_popular;

    if (Object.keys(data).length === 0) {
      res.status(400).json({ error: "No fields to update" });
      return;
    }

    const updated = await prisma.item.update({ where: { id }, data }).catch((e: { code?: string }) => {
      if (e.code === "P2025") return null;
      throw e;
    });

    if (!updated) {
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

    const updated = await prisma.item.update({
      where: { id },
      data: { isAvailable: is_available },
    }).catch((e: { code?: string }) => {
      if (e.code === "P2025") return null;
      throw e;
    });

    if (!updated) {
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

    const deleted = await prisma.item.delete({ where: { id } }).catch((e: { code?: string }) => {
      if (e.code === "P2025") return null;
      throw e;
    });

    if (!deleted) {
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
