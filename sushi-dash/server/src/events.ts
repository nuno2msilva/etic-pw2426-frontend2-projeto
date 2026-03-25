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

// ── Timeout Configuration ────────────────────────────────────────────
/** Server-side idle timeout: disconnect customer if no new orders placed for this duration (30 minutes) */
const IDLE_TIMEOUT_MS = 30 * 60 * 1000;

/** Server-side keep-alive ping interval to prevent proxy/firewall timeout (30 seconds) */
const KEEP_ALIVE_INTERVAL_MS = 30 * 1000;

/**
 * Exported for testing/monitoring.
 * Note: These values are mirrored in src/lib/timeouts.ts for client-side use.
 * Keep them in sync if changing timeout behavior.
 */
export function getIdleTimeoutMs(): number {
  return IDLE_TIMEOUT_MS;
}

export function getKeepAliveIntervalMs(): number {
  return KEEP_ALIVE_INTERVAL_MS;
}

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

interface ConnectionMeta {
  tableId: number | null;
  clientId: string | null;
  customerJti: string | null;
  lastOrderTime: number; // Timestamp of last order at this table (for idle timeout)
}

const connectionMeta = new Map<Response, ConnectionMeta>();

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
  const hasRequestedTableId = typeof requestedTableId === "number" && !Number.isNaN(requestedTableId);
  const hasAuthenticatedCustomerTableId =
    typeof authenticatedCustomerTableId === "number" && !Number.isNaN(authenticatedCustomerTableId);

  // Only track presence for explicit customer-table subscriptions.
  // This prevents selector/logout SSE connections (no tableId requested)
  // from showing a table as ON if a stale cookie still exists briefly.
  if (!hasRequestedTableId || !hasAuthenticatedCustomerTableId) {
    return null;
  }

  // Presence remains authoritative to authenticated customer session.
  // If request/auth mismatch, prefer server-decoded table id.
  return authenticatedCustomerTableId;
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
  connectionMeta.delete(res);

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

/** Force-disconnect tracked browser client connection (if present). */
export function disconnectClientById(clientId: string): boolean {
  const tracked = clientConnections.get(clientId);
  if (!tracked) return false;

  cleanupConnection(tracked.connection);
  broadcastPresence();
  return true;
}

/** Force-disconnect all active customer connections for the provided token id. */
export function disconnectCustomerConnectionsByJti(jti: string): number {
  if (!jti) return 0;

  const toDisconnect: Response[] = [];
  for (const [res, meta] of connectionMeta) {
    if (meta.customerJti === jti) {
      toDisconnect.push(res);
    }
  }

  for (const res of toDisconnect) {
    cleanupConnection(res);
  }

  if (toDisconnect.length > 0) {
    broadcastPresence();
  }

  return toDisconnect.length;
}

/** Get current presence counts: { tableId: connectedCount } */
export function getPresence(): Record<number, number> {
  const presence: Record<number, number> = {};
  for (const [tableId, set] of tableClients) {
    if (set.size > 0) presence[tableId] = set.size;
  }
  return presence;
}

/** Update last order timestamp for all connections to a given table. */
export function updateLastOrderTimeForTable(tableId: number): void {
  const connectionSet = tableClients.get(tableId);
  if (!connectionSet) return;

  const now = Date.now();
  for (const res of connectionSet) {
    const meta = connectionMeta.get(res);
    if (meta) {
      meta.lastOrderTime = now;
    }
  }
}

/**
 * Remove idle connections (no orders for 30+ minutes).
 * Separated from broadcast to avoid recursion.
 */
function cleanupIdleConnections(): void {
  const now = Date.now();
  const toDisconnect: Response[] = [];

  // Identify idle connections
  for (const [res, meta] of connectionMeta) {
    if (
      meta.tableId &&
      !Number.isNaN(meta.tableId) &&
      now - meta.lastOrderTime > IDLE_TIMEOUT_MS
    ) {
      toDisconnect.push(res);
    }
  }

  // Clean them up
  for (const res of toDisconnect) {
    const meta = connectionMeta.get(res);
    clients.delete(res);
    connectionMeta.delete(res);

    if (meta?.tableId) {
      removeFromTablePresence(meta.tableId, res);
    }

    // Remove from client connections tracking if present
    for (const [clientId, entry] of clientConnections) {
      if (entry.connection === res) {
        clientConnections.delete(clientId);
        break;
      }
    }

    try {
      res.end();
    } catch {
      // Already closed
    }
  }
}

/** Broadcast current table presence to all clients */
function broadcastPresence(): void {
  // Clean up any idle connections before broadcasting
  cleanupIdleConnections();
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
  const customerJti = req.customerAuth?.jti ?? null;

  connectionMeta.set(res, {
    tableId,
    clientId,
    customerJti,
    lastOrderTime: Date.now(), // Fresh connection; order timestamp is now
  });

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
  }, KEEP_ALIVE_INTERVAL_MS);

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
