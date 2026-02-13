/**
 * routes/orders.ts — Order endpoints
 *
 * GET    /api/orders                        — All orders (kitchen/manager)
 * GET    /api/orders/table/:tableId         — Orders for a table (customer/kitchen/manager)
 * POST   /api/orders/table/:tableId         — Create order (customer)
 * PATCH  /api/orders/:id/status             — Update order status (kitchen/manager)
 * PATCH  /api/orders/:id/cancel             — Cancel order (customer who owns it, or manager)
 * DELETE /api/orders/:id                    — Delete order (manager)
 */

import { Router } from "express";
import prisma from "../db/prisma.js";
import { requireRole, requireTable } from "../middleware/auth.js";
import { broadcast } from "../events.js";
import { OrderStatus } from "@prisma/client";

const router = Router();

/** Shared include for loading orders with table + items */
const orderInclude = {
  table: { select: { label: true } },
  items: { include: { item: { select: { name: true, emoji: true } } } },
} as const;

/** Map a Prisma order (with includes) to the API response shape */
function formatOrder(o: any) {
  return {
    id: o.id,
    table_id: o.tableId,
    table_label: o.table.label,
    status: o.status,
    createdAt: o.createdAt,
    items: o.items.map((oi: any) => ({
      id: oi.itemId,
      name: oi.item.name,
      emoji: oi.item.emoji,
      quantity: oi.quantity,
    })),
  };
}

// ── All orders (kitchen / manager) ───────────────────────────
router.get("/", requireRole("kitchen", "manager"), async (_req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: orderInclude,
      orderBy: { createdAt: "desc" },
    });
    res.json(orders.map(formatOrder));
  } catch (err) {
    console.error("Orders fetch error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Orders for a specific table ──────────────────────────────
router.get("/table/:tableId", requireTable, async (req, res) => {
  try {
    const tableId = Number(req.params.tableId);
    const orders = await prisma.order.findMany({
      where: { tableId },
      include: orderInclude,
      orderBy: { createdAt: "desc" },
    });
    res.json(orders.map(formatOrder));
  } catch (err) {
    console.error("Table orders fetch error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Create order ─────────────────────────────────────────────
router.post("/table/:tableId", requireTable, async (req, res) => {
  try {
    const tableId = Number(req.params.tableId);
    const { items } = req.body as {
      items?: { id: number; quantity: number }[];
    };

    if (!items || items.length === 0) {
      res.status(400).json({ error: "Order must contain at least one item" });
      return;
    }

    // Check settings limits
    const settings = await prisma.setting.findMany({
      where: { key: { in: ["maxItemsPerOrder", "maxActiveOrdersPerTable"] } },
    });
    const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));

    const maxItems = Number(settingsMap.maxItemsPerOrder ?? 10);
    const maxActive = Number(settingsMap.maxActiveOrdersPerTable ?? 2);

    const totalQty = items.reduce((sum, i) => sum + i.quantity, 0);
    if (totalQty > maxItems) {
      res.status(400).json({ error: `Order exceeds max ${maxItems} items` });
      return;
    }

    const activeCount = await prisma.order.count({
      where: { tableId, status: { in: [OrderStatus.queued, OrderStatus.preparing] } },
    });
    if (activeCount >= maxActive) {
      res.status(400).json({ error: `Table already has ${maxActive} active orders` });
      return;
    }

    // Verify all items exist and are available
    const itemIds = items.map((i) => i.id);
    const availableItems = await prisma.item.findMany({
      where: { id: { in: itemIds }, isAvailable: true },
      select: { id: true },
    });
    const availableIds = new Set(availableItems.map((i) => i.id));
    const unavailable = itemIds.filter((id) => !availableIds.has(id));
    if (unavailable.length > 0) {
      res.status(400).json({ error: "Some items are no longer available", unavailableIds: unavailable });
      return;
    }

    // Create order + items in a transaction
    const order = await prisma.order.create({
      data: {
        tableId,
        status: OrderStatus.queued,
        items: {
          create: items.map((i) => ({ itemId: i.id, quantity: i.quantity })),
        },
      },
      include: orderInclude,
    });

    broadcast({ type: "order-created", tableId, orderId: order.id });
    res.status(201).json(formatOrder(order));
  } catch (err) {
    console.error("Order create error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Update order status (kitchen / manager) ──────────────────
router.patch("/:id/status", requireRole("kitchen", "manager"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body as { status?: string };

    const validStatuses = Object.values(OrderStatus) as string[];
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({ error: `status must be one of: ${validStatuses.join(", ")}` });
      return;
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { status: status as OrderStatus },
      select: { id: true, tableId: true, status: true },
    }).catch((e: any) => {
      if (e.code === "P2025") return null;
      throw e;
    });

    if (!updated) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    broadcast({ type: "order-updated", orderId: id, status, tableId: updated.tableId });
    res.json({ success: true, id, status });
  } catch (err) {
    console.error("Order status update error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Cancel order (customer who owns it, or manager) ──────────
router.patch("/:id/cancel", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!req.auth) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const order = await prisma.order.findUnique({
      where: { id },
      select: { id: true, tableId: true, status: true },
    });

    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    // Customers can only cancel their own table's orders
    if (req.auth.role === "customer" && req.auth.tableId !== order.tableId) {
      res.status(403).json({ error: "Cannot cancel another table's order" });
      return;
    }

    // Only pending orders can be cancelled by customers
    if (req.auth.role === "customer" && order.status !== OrderStatus.queued) {
      res.status(400).json({ error: "Can only cancel queued orders" });
      return;
    }

    await prisma.order.update({ where: { id }, data: { status: OrderStatus.cancelled } });
    broadcast({ type: "order-cancelled", orderId: id, tableId: order.tableId });
    res.json({ success: true, id, status: "cancelled" });
  } catch (err) {
    console.error("Order cancel error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Delete order (manager only) ──────────────────────────────
router.delete("/:id", requireRole("manager"), async (req, res) => {
  try {
    const id = Number(req.params.id);

    // Delete items first, then the order
    const deleteItems = prisma.orderItem.deleteMany({ where: { orderId: id } });
    const deleteOrder = prisma.order.delete({ where: { id } });

    try {
      await prisma.$transaction([deleteItems, deleteOrder]);
    } catch (e: any) {
      if (e.code === "P2025") {
        res.status(404).json({ error: "Order not found" });
        return;
      }
      throw e;
    }

    broadcast({ type: "order-deleted", orderId: id });
    res.json({ success: true });
  } catch (err) {
    console.error("Order delete error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
