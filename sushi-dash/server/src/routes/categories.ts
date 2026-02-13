/**
 * routes/categories.ts — Category management endpoints (Prisma)
 *
 * GET    /api/categories           — List all categories
 * POST   /api/categories           — Add category (manager)
 * PUT    /api/categories/:id       — Update category (manager)
 * DELETE /api/categories/:id       — Delete category (manager)
 */

import { Router } from "express";
import prisma from "../db/prisma.js";
import { requireRole } from "../middleware/auth.js";
import { broadcast } from "../events.js";

const router = Router();

// ── List all categories ──────────────────────────────────────
router.get("/", async (_req, res) => {
  try {
    const rows = await prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });
    // Map to snake_case for API backward compat
    res.json(rows.map(r => ({ id: r.id, name: r.name, sort_order: r.sortOrder })));
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
    const maxRow = await prisma.category.aggregate({ _max: { sortOrder: true } });
    const nextOrder = (maxRow._max.sortOrder ?? 0) + 1;

    const category = await prisma.category.create({
      data: { name, sortOrder: nextOrder },
    });

    broadcast({ type: "menu-changed" });
    res.status(201).json({ id: category.id, name: category.name, sort_order: category.sortOrder });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2002") {
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

    const data: { name?: string; sortOrder?: number } = {};
    if (name !== undefined) data.name = name;
    if (sort_order !== undefined) data.sortOrder = sort_order;

    if (Object.keys(data).length === 0) {
      res.status(400).json({ error: "No fields to update" });
      return;
    }

    const updated = await prisma.category.update({
      where: { id },
      data,
    }).catch((e: { code?: string }) => {
      if (e.code === "P2025") return null; // Not found
      throw e;
    });

    if (!updated) {
      res.status(404).json({ error: "Category not found" });
      return;
    }

    broadcast({ type: "menu-changed" });
    res.json({ success: true, id });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2002") {
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

    const deleted = await prisma.category.delete({
      where: { id },
    }).catch((e: { code?: string }) => {
      if (e.code === "P2025") return null;
      throw e;
    });

    if (!deleted) {
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
