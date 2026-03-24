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

/** Map of browser clientId -> current SSE response + tracked table */
const clientConnections = new Map<string, ClientConnectionEntry<Response>>();

export interface ClientConnectionEntry<TConnection> {
  connection: TConnection;
  tableId: number | null;
}

/**
 * Upserts a client connection in a table-agnostic way.
 * Returns previous entry when replacing an older connection for the same client.
 */
export function upsertClientConnection<TConnection>(
  connections: Map<string, ClientConnectionEntry<TConnection>>,
  clientId: string,
  connection: TConnection,
  tableId: number | null,
): ClientConnectionEntry<TConnection> | null {
  const existing = connections.get(clientId);
  if (existing && existing.connection !== connection) {
    connections.set(clientId, { connection, tableId });
    return existing;
  }

  connections.set(clientId, { connection, tableId });
  return null;
}

export function resolveTrackedTableId(
  requestedTableId: number | null,
  authenticatedCustomerTableId: number | null,
): number | null {
  // Presence must be authoritative to authenticated customer session.
  // Never trust client-provided tableId over server-decoded auth cookie.
  if (authenticatedCustomerTableId && !Number.isNaN(authenticatedCustomerTableId)) {
    return authenticatedCustomerTableId;
  }

  // No authenticated customer session -> do not track table presence.
  return null;
}

function removeFromTablePresence(tableId: number | null, res: Response): void {
  if (!tableId || Number.isNaN(tableId)) return;

  const set = tableClients.get(tableId);
  if (!set) return;

  set.delete(res);
  if (set.size === 0) tableClients.delete(tableId);
}

/** Send an event to every connected client, with graceful error handling. */
export function broadcast(event: ServerEvent): void {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  const deadClients: Response[] = [];

  for (const res of clients) {
    try {
      res.write(data);
    } catch (err) {
      // Connection is broken; mark for cleanup
      deadClients.push(res);
    }
  }

  // Clean up dead connections
  for (const res of deadClients) {
    cleanupConnection(res);
  }
}

/**
 * Safely cleans up a connection from all tracking structures.
 * Called when a connection is detected as closed/broken.
 */
function cleanupConnection(res: Response): void {
  clients.delete(res);

  // Remove from all table presence maps
  for (const [tableId, set] of tableClients) {
    if (set.has(res)) {
      set.delete(res);
      if (set.size === 0) {
        tableClients.delete(tableId);
      }
    }
  }

  // Remove from client connections if it's tracked
  for (const [clientId, entry] of clientConnections) {
    if (entry.connection === res) {
      clientConnections.delete(clientId);
      break;
    }
  }

  // Ensure connection is ended
  try {
    res.end();
  } catch {
    // Already closed
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
  const requestedTableId = rawTableId ? Number(rawTableId) : null;
  const authenticatedCustomerTableId = req.customerAuth?.tableId ?? null;
  const tableId = resolveTrackedTableId(requestedTableId, authenticatedCustomerTableId);

  let rawClientId = req.query.clientId;
  // If no clientId provided, this is a staff/non-tracked connection
  const clientId = typeof rawClientId === "string" && rawClientId.trim() ? rawClientId : null;

  // Replace any existing SSE connection for this browser client id.
  // This prevents stale table presence when a user switches tables.
  // This only applies to customer connections with valid clientId.
  if (clientId) {
    const replaced = upsertClientConnection(clientConnections, clientId, res, tableId);
    if (replaced && replaced.connection !== res) {
      // Ensure old connection is fully cleaned up
      clients.delete(replaced.connection);
      removeFromTablePresence(replaced.tableId, replaced.connection);
      try {
        replaced.connection.end();
      } catch {
        // Connection already closed
      }
    }
  }

  if (tableId && !Number.isNaN(tableId)) {
    if (!tableClients.has(tableId)) {
      tableClients.set(tableId, new Set());
    }
    tableClients.get(tableId)!.add(res);
    broadcastPresence();
  }

  // Send current presence snapshot to the newly connected client
  const presenceData = `data: ${JSON.stringify({ type: "table-presence", presence: getPresence() })}\n\n`;
  try {
    res.write(presenceData);
  } catch {
    // Connection already closed, clean up
    cleanupConnection(res);
    return;
  }

  // Keep-alive ping every 30s to prevent proxy/timeout disconnects
  const keepAlive = setInterval(() => {
    try {
      res.write(":ping\n\n");
    } catch {
      // Connection broken, stop keep-alive
      clearInterval(keepAlive);
      cleanupConnection(res);
    }
  }, 30_000);

  // Handle normal connection closure
  req.on("close", () => {
    clearInterval(keepAlive);

    // Use the comprehensive cleanup function
    // which handles all tracking structures
    cleanupConnection(res);

    // Broadcast updated presence after cleanup
    broadcastPresence();
  });

  // Also listen for errors on the response to catch abnormal closes
  res.on("error", () => {
    clearInterval(keepAlive);
    cleanupConnection(res);
    broadcastPresence();
  });
}
