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
import { query, execute, getConnection } from "../db/connection.js";
import { requireRole, requireTable } from "../middleware/auth.js";
import { broadcast } from "../events.js";

const router = Router();

interface OrderRow {
  id: number;
  table_id: number;
  table_label: string;
  status: string;
  created_at: string;
}

interface OrderItemRow {
  id: number;
  order_id: number;
  item_id: number;
  item_name: string;
  item_emoji: string;
  quantity: number;
}

/** Build full order objects with nested items */
async function enrichOrders(orders: OrderRow[]) {
  if (orders.length === 0) return [];

  const ids = orders.map((o) => o.id);
  const placeholders = ids.map(() => "?").join(",");

  const items = await query<OrderItemRow>(
    `SELECT oi.id, oi.order_id, oi.item_id, i.name AS item_name, i.emoji AS item_emoji, oi.quantity
     FROM order_items oi
     JOIN items i ON i.id = oi.item_id
     WHERE oi.order_id IN (${placeholders})`,
    ids
  );

  const itemsByOrder = new Map<number, OrderItemRow[]>();
  for (const item of items) {
    const list = itemsByOrder.get(item.order_id) ?? [];
    list.push(item);
    itemsByOrder.set(item.order_id, list);
  }

  return orders.map((o) => ({
    id: o.id,
    table_id: o.table_id,
    table_label: o.table_label,
    status: o.status,
    createdAt: o.created_at,
    items: (itemsByOrder.get(o.id) ?? []).map((i) => ({
      id: i.item_id,
      name: i.item_name,
      emoji: i.item_emoji,
      quantity: i.quantity,
    })),
  }));
}

// ── All orders (kitchen / manager) ───────────────────────────
router.get("/", requireRole("kitchen", "manager"), async (_req, res) => {
  try {
    const orders = await query<OrderRow>(
      "SELECT o.id, o.table_id, t.label AS table_label, o.status, o.created_at FROM orders o JOIN tables_config t ON t.id = o.table_id ORDER BY o.created_at DESC"
    );
    res.json(await enrichOrders(orders));
  } catch (err) {
    console.error("Orders fetch error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Orders for a specific table ──────────────────────────────
router.get("/table/:tableId", requireTable, async (req, res) => {
  try {
    const tableId = Number(req.params.tableId);
    const orders = await query<OrderRow>(
      "SELECT o.id, o.table_id, t.label AS table_label, o.status, o.created_at FROM orders o JOIN tables_config t ON t.id = o.table_id WHERE o.table_id = ? ORDER BY o.created_at DESC",
      [tableId]
    );
    res.json(await enrichOrders(orders));
  } catch (err) {
    console.error("Table orders fetch error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Create order ─────────────────────────────────────────────
router.post("/table/:tableId", requireTable, async (req, res) => {
  const conn = await getConnection();
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
    const settings = await query<{ key: string; value: string }>(
      `SELECT "key", value FROM settings WHERE "key" IN ('maxItemsPerOrder', 'maxActiveOrdersPerTable')`
    );
    const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));

    const maxItems = Number(settingsMap.maxItemsPerOrder ?? 10);
    const maxActive = Number(settingsMap.maxActiveOrdersPerTable ?? 2);

    const totalQty = items.reduce((sum, i) => sum + i.quantity, 0);
    if (totalQty > maxItems) {
      res.status(400).json({ error: `Order exceeds max ${maxItems} items` });
      return;
    }

    const activeOrders = await query<{ count: number }>(
      "SELECT COUNT(*) as count FROM orders WHERE table_id = ? AND status IN ('queued', 'preparing')",
      [tableId]
    );
    if (activeOrders[0].count >= maxActive) {
      res.status(400).json({ error: `Table already has ${maxActive} active orders` });
      return;
    }

    // Verify all items exist and are available
    const itemIds = items.map((i) => i.id);
    const placeholders = itemIds.map((_, idx) => `$${idx + 1}`).join(", ");
    const availableItems = await query<{ id: number }>(
      `SELECT id FROM items WHERE id IN (${placeholders}) AND is_available = TRUE`,
      itemIds
    );
    const availableIds = new Set(availableItems.map((i) => i.id));
    const unavailable = itemIds.filter((id) => !availableIds.has(id));
    if (unavailable.length > 0) {
      res.status(400).json({ error: "Some items are no longer available", unavailableIds: unavailable });
      return;
    }

    await conn.query("BEGIN");

    const orderResult = await conn.query(
      "INSERT INTO orders (table_id, status) VALUES ($1, 'queued') RETURNING id",
      [tableId]
    );
    const orderId = Number(orderResult.rows[0].id);

    for (const item of items) {
      await conn.query(
        "INSERT INTO order_items (order_id, item_id, quantity) VALUES ($1, $2, $3)",
        [orderId, item.id, item.quantity]
      );
    }

    await conn.query("COMMIT");

    // Return the full order
    const [order] = await query<OrderRow>(
      "SELECT o.id, o.table_id, t.label AS table_label, o.status, o.created_at FROM orders o JOIN tables_config t ON t.id = o.table_id WHERE o.id = ?",
      [orderId]
    );
    const enriched = await enrichOrders([order]);
    broadcast({ type: "order-created", tableId, orderId });
    res.status(201).json(enriched[0]);
  } catch (err) {
    await conn.query("ROLLBACK");
    console.error("Order create error:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    conn.release();
  }
});

// ── Update order status (kitchen / manager) ──────────────────
router.patch("/:id/status", requireRole("kitchen", "manager"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body as { status?: string };

    const validStatuses = ["queued", "preparing", "ready", "delivered", "cancelled"];
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({ error: `status must be one of: ${validStatuses.join(", ")}` });
      return;
    }

    const result = await execute(
      "UPDATE orders SET status = ? WHERE id = ?",
      [status, id]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    // Look up the table for this order so we can broadcast to the right client
    const orderRows = await query<{ table_id: number }>("SELECT table_id FROM orders WHERE id = ?", [id]);
    const tableId = orderRows[0]?.table_id ?? 0;
    broadcast({ type: "order-updated", orderId: id, status, tableId });
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

    const orders = await query<OrderRow>(
      "SELECT id, table_id, status, created_at FROM orders WHERE id = ?",
      [id]
    );

    if (orders.length === 0) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    const order = orders[0];

    // Customers can only cancel their own table's orders
    if (req.auth.role === "customer" && req.auth.tableId !== order.table_id) {
      res.status(403).json({ error: "Cannot cancel another table's order" });
      return;
    }

    // Only pending orders can be cancelled by customers
    if (req.auth.role === "customer" && order.status !== "queued") {
      res.status(400).json({ error: "Can only cancel queued orders" });
      return;
    }

    await execute("UPDATE orders SET status = 'cancelled' WHERE id = ?", [id]);
    broadcast({ type: "order-cancelled", orderId: id, tableId: order.table_id });
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

    // Delete items first (FK constraint)
    await execute("DELETE FROM order_items WHERE order_id = ?", [id]);
    const result = await execute("DELETE FROM orders WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    broadcast({ type: "order-deleted", orderId: id });
    res.json({ success: true });
  } catch (err) {
    console.error("Order delete error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
