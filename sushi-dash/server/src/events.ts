/**
 * events.ts — Server-Sent Events bus
 * ---------------------------------------------------------------------------
 * Lightweight pub/sub for pushing real-time updates to connected clients.
 *
 * Usage (in route handlers):
 *   import { broadcast } from "./events.js";
 *   broadcast({ type: "pin-changed", tableId: 3 });
 *
 * Each connected client gets its own Response object stored in a Set.
 * The SSE endpoint (/api/events) is mounted in index.ts.
 *
 * Table presence:
 *   Customers connect with ?tableId=<id>. The server tracks how many
 *   SSE connections exist per table and broadcasts presence changes so
 *   the table selector can show an "in use" badge.
 * ---------------------------------------------------------------------------
 */

import type { Request, Response } from "express";

// ── Event types ──────────────────────────────────────────────
export type ServerEvent =
  | { type: "pin-changed";    tableId: number }
  | { type: "table-deleted";  tableId: number }
  | { type: "table-added";    tableId: number }
  | { type: "table-updated";  tableId: number }
  | { type: "order-created";  tableId: number; orderId: number }
  | { type: "order-updated";  orderId: number; status: string; tableId: number }
  | { type: "order-cancelled"; orderId: number; tableId: number }
  | { type: "order-deleted";  orderId: number }
  | { type: "menu-changed" }
  | { type: "settings-changed" }
  | { type: "table-presence"; presence: Record<number, number> };

// ── Connected SSE clients ────────────────────────────────────
const clients = new Set<Response>();

/** Map of tableId → Set of connected customer SSE responses */
const tableClients = new Map<number, Set<Response>>();

/** Send an event to every connected client. */
export function broadcast(event: ServerEvent): void {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  for (const res of clients) {
    res.write(data);
  }
}

/** Get current presence counts: { tableId: connectedCount } */
export function getPresence(): Record<number, number> {
  const presence: Record<number, number> = {};
  for (const [tableId, set] of tableClients) {
    if (set.size > 0) presence[tableId] = set.size;
  }
  return presence;
}

/** Broadcast current table presence to all clients */
function broadcastPresence(): void {
  broadcast({ type: "table-presence", presence: getPresence() });
}

/** SSE connection handler — mounted as GET /api/events */
export function sseHandler(req: Request, res: Response): void {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  // Send an initial comment so the client knows the connection is alive
  res.write(":ok\n\n");

  clients.add(res);

  // Track table presence if customer connected with ?tableId=<id>
  const rawTableId = req.query.tableId;
  const tableId = rawTableId ? Number(rawTableId) : null;
  if (tableId && !Number.isNaN(tableId)) {
    if (!tableClients.has(tableId)) {
      tableClients.set(tableId, new Set());
    }
    tableClients.get(tableId)!.add(res);
    broadcastPresence();
  }

  // Send current presence snapshot to the newly connected client
  const presenceData = `data: ${JSON.stringify({ type: "table-presence", presence: getPresence() })}\n\n`;
  res.write(presenceData);

  // Keep-alive ping every 30s to prevent proxy/timeout disconnects
  const keepAlive = setInterval(() => {
    res.write(":ping\n\n");
  }, 30_000);

  req.on("close", () => {
    clearInterval(keepAlive);
    clients.delete(res);

    // Remove from table presence tracking
    if (tableId && !Number.isNaN(tableId)) {
      const set = tableClients.get(tableId);
      if (set) {
        set.delete(res);
        if (set.size === 0) tableClients.delete(tableId);
      }
      broadcastPresence();
    }
  });
}
