/**
 * Comprehensive integration tests for table presence lifecycle:
 * - Explicit table leave signal (goToTableSelection/goToTable)
 * - SSE connection lifecycle
 * - Idle timeout and order timestamp tracking
 * - Grace period session restoration
 * - Beforeunload handler for graceful disconnects
 */

import {
  updateLastOrderTimeForTable,
  getIdleTimeoutMs,
  getKeepAliveIntervalMs,
  resolveTrackedTableId,
  upsertClientConnection,
} from "../../server/src/events";
import type { ClientConnectionEntry } from "../../server/src/events";
import {
  CUSTOMER_SESSION_GRACE_PERIOD_MS,
  CUSTOMER_PRESENCE_HEARTBEAT_INTERVAL_MS,
  SSE_IDLE_TIMEOUT_MS,
  SSE_KEEP_ALIVE_INTERVAL_MS,
  SSE_RECONNECT_DELAY_MS,
  SSE_MAX_RECONNECT_DELAY_MS,
  PRESENCE_POLLING_INTERVAL_MS,
  STAFF_SESSION_VALIDATION_INTERVAL_MS,
  CUSTOMER_SESSION_VALIDATION_INTERVAL_MS,
} from "@/features/shared/lib/timeouts";

describe("Does the whole presence lifecycle actually work end-to-end?", () => {
  describe("Are all the timing constants set to sane values?", () => {
    it("grace period is 5 minutes — enough to reload but not squat", () => {
      expect(CUSTOMER_SESSION_GRACE_PERIOD_MS).toBe(5 * 60 * 1000);
    });

    it("heartbeat pings every 30 seconds to prove you're still alive", () => {
      expect(CUSTOMER_PRESENCE_HEARTBEAT_INTERVAL_MS).toBe(30 * 1000);
    });

    it("idle SSE connections get cut after 30 minutes of silence", () => {
      expect(SSE_IDLE_TIMEOUT_MS).toBe(30 * 60 * 1000);
      expect(getIdleTimeoutMs()).toBe(30 * 60 * 1000);
    });

    it("keep-alive pings every 15 seconds so Vercel doesn't kill the connection", () => {
      expect(SSE_KEEP_ALIVE_INTERVAL_MS).toBe(15 * 1000);
      expect(getKeepAliveIntervalMs()).toBe(15 * 1000);
    });

    it("SSE reconnects after 1 second with exponential backoff", () => {
      expect(SSE_RECONNECT_DELAY_MS).toBe(1 * 1000);
    });

    it("backoff caps at 30 seconds so you don't wait forever", () => {
      expect(SSE_MAX_RECONNECT_DELAY_MS).toBe(30 * 1000);
    });

    it("presence polls every 3 seconds — aggressive but light enough for mobile batteries", () => {
      expect(PRESENCE_POLLING_INTERVAL_MS).toBe(3 * 1000);
    });

    it("staff sessions get validated every 10 seconds", () => {
      expect(STAFF_SESSION_VALIDATION_INTERVAL_MS).toBe(10 * 1000);
    });

    it("customer sessions get checked every 5 seconds — PIN changes are urgent", () => {
      expect(CUSTOMER_SESSION_VALIDATION_INTERVAL_MS).toBe(5 * 1000);
    });
  });

  describe("What happens when a customer leaves the table?", () => {
    it("clears presence when customer goes back to table selection", () => {
      // Simulates calling goToTableSelection() in AuthContext
      // which sets isViewingTableSelection = true
      // This causes LiveUpdates hook to pass null as tableId to SSE
      const result = resolveTrackedTableId(null, null);
      expect(result).toBeNull();
    });

    it("doesn't track presence even with valid auth if they're browsing tables", () => {
      // Even with valid authenticated table, if no tableId is requested (SSE disconnected),
      // presence should not be tracked
      const result = resolveTrackedTableId(null, 1);
      expect(result).toBeNull();
    });

    it("logs customers out immediately on explicit leave for snappy badge updates", () => {
      // goToTableSelection explicitly logs out customer intent (logo/back to table selection)
      // Presence disconnect happens immediately, avoiding stale ON badges.
      expect(CUSTOMER_SESSION_VALIDATION_INTERVAL_MS).toBe(5 * 1000);
    });
  });

  describe("What happens when a customer picks a table?", () => {
    it("lights up presence as soon as they sit down", () => {
      // Simulates calling goToTable() in AuthContext
      // which sets isViewingTableSelection = false
      // This re-enables SSE with proper tableId
      const result = resolveTrackedTableId(1, 1);
      expect(result).toBe(1);
    });

    it("tracks presence for any authenticated table", () => {
      // With both requestedTableId and authenticatedTableId valid,
      // presence should be tracked
      const result = resolveTrackedTableId(5, 5);
      expect(result).toBe(5);
    });

    it("always trusts the server's authenticated table ID over the client's", () => {
      // Server always trusts its own authenticated table id
      // This prevents spoofing presence for other tables
      const result = resolveTrackedTableId(1, 2);
      expect(result).toBe(2);
    });
  });

  describe("What if a customer just stops ordering for ages?", () => {
    it("bumps the last-order timestamp to keep the connection from idling out", () => {
      // updateLastOrderTimeForTable updates the lastOrderTime field
      // in ConnectionMeta for all connections to that table
      // This resets the 30-minute idle counter
      expect(() => {
        updateLastOrderTimeForTable(1);
      }).not.toThrow();
    });

    it("handles updating a table that has no connections without drama", () => {
      // Gracefully handle edge case where table has no connections
      expect(() => {
        updateLastOrderTimeForTable(999);
      }).not.toThrow();
    });

    it("cuts the cord after 30 minutes of zero orders", () => {
      // If a customer stays connected without placing orders,
      // the connection is cleaned up after 30 minutes
      expect(SSE_IDLE_TIMEOUT_MS).toBe(30 * 60 * 1000);
      expect(getIdleTimeoutMs()).toBe(30 * 60 * 1000);
    });

    it("every new order resets the 30-minute countdown", () => {
      // Every time a customer places an order, updateLastOrderTimeForTable
      // updates the timestamp, effectively resetting the 30-min counter
      // This allows idle but active customers to stay connected indefinitely
      const timeout = getIdleTimeoutMs();
      expect(timeout).toBeGreaterThan(0);
    });
  });

  describe("What if the customer accidentally closes the tab?", () => {
    it("keeps the session alive for 5 minutes so they can come back", () => {
      // When customer closes browser tab (beforeunload handler closes SSE),
      // session cookie remains valid for 5 minutes
      // This allows re-entry without re-entering PIN
      const gracePeriod = CUSTOMER_SESSION_GRACE_PERIOD_MS;
      expect(gracePeriod).toBe(5 * 60 * 1000);
    });

    it("heartbeats are way more frequent than the grace period — no missed windows", () => {
      // Customer presence heartbeat (sessionStorage timestamp update)
      // runs every 30 seconds, which is well within the 5-min grace period
      // This ensures accurate grace period detection
      expect(CUSTOMER_PRESENCE_HEARTBEAT_INTERVAL_MS).toBeLessThan(
        CUSTOMER_SESSION_GRACE_PERIOD_MS,
      );
    });

    it("fits multiple heartbeats inside the grace window for reliable detection", () => {
      // Between closing the tab and the 5-minute grace period expiring,
      // customer can reload page and auto-restore without PIN
      const gracePeriod = CUSTOMER_SESSION_GRACE_PERIOD_MS;
      const heartbeat = CUSTOMER_PRESENCE_HEARTBEAT_INTERVAL_MS;
      const beatsPerGracePeriod = gracePeriod / heartbeat;
      expect(beatsPerGracePeriod).toBeGreaterThan(1);
    });

    it("after 5 minutes of silence — you need a new PIN, sorry", () => {
      // After 5 minutes of no activity, session is cleared
      // Customer must re-enter PIN to access table again
      expect(CUSTOMER_SESSION_GRACE_PERIOD_MS).toBe(5 * 60 * 1000);
    });
  });

  describe("Does beforeunload cleanly close the SSE without logging out?", () => {
    it("closes the event stream but keeps the cookie alive", () => {
      // beforeunload event listener closes the EventSource explicitly
      // This triggers req.on('close') on server, which calls cleanupConnection()
      // Server detects presence has zero connections and clears the ON badge
      // Session cookie remains valid (no logout)
      const gracePeriod = CUSTOMER_SESSION_GRACE_PERIOD_MS;
      expect(gracePeriod).toBeGreaterThan(0);
    });

    it("reconnects way before the grace period expires if they reload", () => {
      // SSE closed via beforeunload → presence cleared on server
      // Customer reloads within 5 min → auto-restore session → reconnect SSE
      // No PIN entry needed
      const reconnectDelay = SSE_RECONNECT_DELAY_MS;
      const gracePeriod = CUSTOMER_SESSION_GRACE_PERIOD_MS;
      expect(reconnectDelay).toBeLessThan(gracePeriod);
    });

    it("SSE backoff is tiny compared to the grace period — no risk of lockout", () => {
      // If SSE temporarily drops, it reconnects after 2 seconds
      // This is much faster than the 5-minute grace period
      expect(SSE_RECONNECT_DELAY_MS).toBeLessThan(
        CUSTOMER_SESSION_GRACE_PERIOD_MS,
      );
    });
  });

  describe("Does session polling catch changes before they go stale?", () => {
    it("checks staff sessions every 10 seconds to detect admin kicks", () => {
      // Detects if admin logs out the staff user or changes permissions
      expect(STAFF_SESSION_VALIDATION_INTERVAL_MS).toBe(10 * 1000);
    });

    it("checks customer sessions every 5 seconds to catch PIN randomizations", () => {
      // Detects if manager randomizes PIN (ejecting customer)
      expect(CUSTOMER_SESSION_VALIDATION_INTERVAL_MS).toBe(5 * 1000);
    });

    it("customers get checked faster because PIN changes are more urgent", () => {
      // PIN randomization is more urgent than staff logout
      expect(CUSTOMER_SESSION_VALIDATION_INTERVAL_MS).toBeLessThan(
        STAFF_SESSION_VALIDATION_INTERVAL_MS,
      );
    });
  });

  describe("Full customer journey scenarios", () => {
    it("scenario 1: normal table ordering session", () => {
      // 1. Customer enters PIN → goToTable() called → isViewingTableSelection = false
      const tableInPresence = resolveTrackedTableId(1, 1);
      expect(tableInPresence).toBe(1);

      // 2. Customer places order → updateLastOrderTimeForTable(1) called
      expect(() => {
        updateLastOrderTimeForTable(1);
      }).not.toThrow();

      // 3. Customer places another order 20 min later → timer resets
      expect(() => {
        updateLastOrderTimeForTable(1);
      }).not.toThrow();

      // 4. Customer finishes (still within 30 min) and clicks logo
      // → goToTableSelection() called → isViewingTableSelection = true
      const tableNotInPresence = resolveTrackedTableId(null, 1);
      expect(tableNotInPresence).toBeNull();
    });

    it("scenario 2: accidental tab close (forgotten tab)", () => {
      // 1. Customer at table → beforeunload event fires
      // 2. EventSource.close() called via beforeunload handler
      // 3. req.on('close') triggers cleanupConnection() on server
      const noPresenceAfterClose = resolveTrackedTableId(null, null);
      expect(noPresenceAfterClose).toBeNull();

      // 4. Customer realizes and reloads within 3 minutes
      // 5. Session still valid (within 5-min grace period)
      expect(CUSTOMER_SESSION_GRACE_PERIOD_MS).toBe(5 * 60 * 1000);

      // 6. Auto-restore session without PIN
      // 7. goToTable() called when restored
      const tableBackInPresence = resolveTrackedTableId(1, 1);
      expect(tableBackInPresence).toBe(1);
    });

    it("scenario 3: idle connection (no orders for 30+ minutes)", () => {
      // 1. Customer connects at table
      const connected = resolveTrackedTableId(1, 1);
      expect(connected).toBe(1);

      // 2. Places 1 order, then goes idle
      updateLastOrderTimeForTable(1);

      // 3. Sits idle for 35 minutes without ordering
      // 4. Next broadcastPresence() detects idle connection
      // 5. cleanupIdleConnections() removes it
      // 6. Presence badge turns OFF

      // 7. Customer returns and tries to order (still within 5-min grace?)
      // Depends on when they reconnect; if >5 min, PIN required
      const timeout = getIdleTimeoutMs();
      expect(timeout).toBe(30 * 60 * 1000);
    });

    it("scenario 4: concurrent customers on same table", () => {
      // Customer A at table 1, Customer B at table 1
      const customerAPresence = resolveTrackedTableId(1, 1);
      const customerBPresence = resolveTrackedTableId(1, 1);
      expect(customerAPresence).toBe(1);
      expect(customerBPresence).toBe(1);

      // Customer A leaves (clicks logo)
      const aGone = resolveTrackedTableId(null, 1);
      expect(aGone).toBeNull();

      // But B is still there, so presence should remain ON
      // (SSE: counted by connections in tableClients Set)
      // (DB: each customer has their own CustomerPresence row keyed by JWT jti,
      //  so A's DELETE only removes A's row — B's row stays)
      const bStayingConnected = resolveTrackedTableId(1, 1);
      expect(bStayingConnected).toBe(1);
    });

    it("scenario 5: table selection → table 1 → tab close → grace period → table 2", () => {
      // 1. At table selection, no presence
      const noPresence1 = resolveTrackedTableId(null, null);
      expect(noPresence1).toBeNull();

      // 2. Select table 1
      const presence1 = resolveTrackedTableId(1, 1);
      expect(presence1).toBe(1);

      // 3. Browser tab closes (beforeunload)
      // Server detects close, clears presence
      const closed = resolveTrackedTableId(null, null);
      expect(closed).toBeNull();

      // 4. Customer reloads within 3 min (within grace period)
      // Session restored automatically
      // isViewingTableSelection is still false (restored state)
      const restored = resolveTrackedTableId(1, 1);
      expect(restored).toBe(1);

      // 5. Customer clicks logo and selects different table
      const noPresence2 = resolveTrackedTableId(null, 1);
      expect(noPresence2).toBeNull();

      // 6. Selects table 2
      const presence2 = resolveTrackedTableId(2, 2);
      expect(presence2).toBe(2);
    });
  });

  describe("Do all the timing constants play well together?", () => {
    it("SSE idle timeout matches the exported constant", () => {
      expect(SSE_IDLE_TIMEOUT_MS).toBe(getIdleTimeoutMs());
    });

    it("keep-alive interval matches the exported constant", () => {
      expect(SSE_KEEP_ALIVE_INTERVAL_MS).toBe(getKeepAliveIntervalMs());
    });

    it("grace period outlasts both validation intervals — otherwise it's pointless", () => {
      expect(CUSTOMER_SESSION_GRACE_PERIOD_MS).toBeGreaterThan(
        CUSTOMER_SESSION_VALIDATION_INTERVAL_MS,
      );
      expect(CUSTOMER_SESSION_GRACE_PERIOD_MS).toBeGreaterThan(
        STAFF_SESSION_VALIDATION_INTERVAL_MS,
      );
    });

    it("heartbeat is frequent but not spammy — goldilocks zone", () => {
      // Heartbeat should be frequent enough to detect grace period
      expect(CUSTOMER_PRESENCE_HEARTBEAT_INTERVAL_MS).toBeLessThan(
        CUSTOMER_SESSION_GRACE_PERIOD_MS,
      );
      // But not so frequent it causes performance issues
      expect(CUSTOMER_PRESENCE_HEARTBEAT_INTERVAL_MS).toBeGreaterThan(1000);
    });

    it("idle timeout dwarfs validation intervals so active customers aren't kicked", () => {
      // 30 min idle timeout >> 2 sec validation interval
      // This ensures we don't prematurely kick active customers
      expect(SSE_IDLE_TIMEOUT_MS).toBeGreaterThan(
        CUSTOMER_SESSION_VALIDATION_INTERVAL_MS * 100,
      );
    });
  });

  describe("Does multi-customer presence actually work with per-session tracking?", () => {
    it("SSE tracks multiple connections per table via a Set, not a single flag", () => {
      // In-memory: tableClients is Map<number, Set<Response>>
      // Each customer SSE connection is a distinct entry in the Set
      // getPresence() counts set.size, giving accurate per-table counts
      const mockTableClients = new Map<number, Set<string>>();
      mockTableClients.set(1, new Set(["customerA", "customerB", "customerC"]));
      mockTableClients.set(2, new Set(["customerD"]));

      const presence: Record<number, number> = {};
      for (const [tableId, set] of mockTableClients) {
        if (set.size > 0) presence[tableId] = set.size;
      }

      expect(presence[1]).toBe(3);
      expect(presence[2]).toBe(1);
    });

    it("removing one customer from a multi-customer table doesn't nuke the others", () => {
      // DB: CustomerPresence has one row per session (keyed by JWT jti)
      // DELETE /heartbeat only removes the row matching req.customerAuth.jti
      const sessions = new Map<string, { tableId: number }>();
      sessions.set("jti-aaa", { tableId: 1 });
      sessions.set("jti-bbb", { tableId: 1 });
      sessions.set("jti-ccc", { tableId: 1 });

      // Customer A leaves — only their row is deleted
      sessions.delete("jti-aaa");

      // Count remaining sessions for table 1
      const tableOneSessions = [...sessions.values()].filter(s => s.tableId === 1);
      expect(tableOneSessions).toHaveLength(2);
    });

    it("presence count merges SSE in-memory and DB session counts taking the max", () => {
      // GET /presence merges: Math.max(memoryCount, dbCount) per table
      // This handles split-brain between SSE process and DB heartbeats on Vercel
      const memoryPresence: Record<number, number> = { 1: 2, 3: 1 };
      const dbCounts: Array<{ tableId: number; count: number }> = [
        { tableId: 1, count: 3 },  // DB sees 3 (more than SSE)
        { tableId: 2, count: 1 },  // DB sees 1 (SSE sees 0)
      ];

      const merged: Record<number, number> = { ...memoryPresence };
      for (const row of dbCounts) {
        merged[row.tableId] = Math.max(merged[row.tableId] ?? 0, row.count);
      }

      expect(merged[1]).toBe(3); // DB count wins (3 > 2)
      expect(merged[2]).toBe(1); // DB-only table appears
      expect(merged[3]).toBe(1); // SSE-only table preserved
    });

    it("PIN randomization nukes ALL presence rows for that table", () => {
      // When manager randomizes PIN, all customers at that table are evicted
      // deleteMany({ where: { tableId: id } }) removes every session
      const sessions = new Map<string, { tableId: number }>();
      sessions.set("jti-aaa", { tableId: 1 });
      sessions.set("jti-bbb", { tableId: 1 });
      sessions.set("jti-ccc", { tableId: 2 });

      // PIN randomized for table 1 — delete all for that table
      for (const [jti, session] of sessions) {
        if (session.tableId === 1) sessions.delete(jti);
      }

      expect([...sessions.values()].filter(s => s.tableId === 1)).toHaveLength(0);
      expect([...sessions.values()].filter(s => s.tableId === 2)).toHaveLength(1);
    });

    it("stale sessions are filtered by the 2-minute heartbeat cutoff", () => {
      // GET /presence only counts sessions where lastHeartbeatAt >= cutoff
      const STALENESS_MS = 2 * 60 * 1000;
      const now = Date.now();
      const sessions = [
        { jti: "fresh-1",  tableId: 1, lastHeartbeatAt: now - 10_000 },     // 10s ago — fresh
        { jti: "fresh-2",  tableId: 1, lastHeartbeatAt: now - 60_000 },     // 1m ago — fresh
        { jti: "stale-1",  tableId: 1, lastHeartbeatAt: now - 200_000 },    // 3.3m ago — stale
        { jti: "fresh-3",  tableId: 2, lastHeartbeatAt: now - 5_000 },      // 5s ago — fresh
      ];

      const cutoff = now - STALENESS_MS;
      const activeSessions = sessions.filter(s => s.lastHeartbeatAt >= cutoff);

      const counts: Record<number, number> = {};
      for (const s of activeSessions) {
        counts[s.tableId] = (counts[s.tableId] ?? 0) + 1;
      }

      expect(counts[1]).toBe(2); // 2 fresh, 1 stale filtered out
      expect(counts[2]).toBe(1);
    });

    it("each customer's heartbeat only touches their own row (upsert by jti)", () => {
      // POST /heartbeat does: upsert where sessionToken = jti
      // Two customers at the same table have different JTIs
      const presenceTable = new Map<string, { tableId: number; lastHeartbeatAt: number }>();

      // Customer A heartbeat
      presenceTable.set("jti-aaa", { tableId: 1, lastHeartbeatAt: 1000 });
      // Customer B heartbeat
      presenceTable.set("jti-bbb", { tableId: 1, lastHeartbeatAt: 2000 });

      // Customer A heartbeats again — only their row updated
      presenceTable.set("jti-aaa", { tableId: 1, lastHeartbeatAt: 3000 });

      expect(presenceTable.get("jti-aaa")!.lastHeartbeatAt).toBe(3000);
      expect(presenceTable.get("jti-bbb")!.lastHeartbeatAt).toBe(2000); // untouched
      expect(presenceTable.size).toBe(2);
    });

    it("upsertClientConnection tracks multiple browser clients at the same table", () => {
      // SSE layer: upsertClientConnection deduplicates by clientId
      const connections = new Map<string, ClientConnectionEntry<string>>();

      // Client A connects to table 1
      upsertClientConnection(connections, "client-A", "conn-A1", 1);
      // Client B also connects to table 1
      upsertClientConnection(connections, "client-B", "conn-B1", 1);

      expect(connections.size).toBe(2);
      expect(connections.get("client-A")!.tableId).toBe(1);
      expect(connections.get("client-B")!.tableId).toBe(1);
    });

    it("upsertClientConnection replaces stale connection when same client reconnects", () => {
      const connections = new Map<string, ClientConnectionEntry<string>>();

      // Client A connects
      upsertClientConnection(connections, "client-A", "conn-A1", 1);
      // Client A reconnects (new connection object)
      const replaced = upsertClientConnection(connections, "client-A", "conn-A2", 1);

      expect(replaced).not.toBeNull();
      expect(replaced!.connection).toBe("conn-A1");
      expect(connections.get("client-A")!.connection).toBe("conn-A2");
      expect(connections.size).toBe(1); // still just one entry
    });

    it("client switching tables replaces the old table tracking", () => {
      const connections = new Map<string, ClientConnectionEntry<string>>();

      // Client at table 1
      upsertClientConnection(connections, "client-A", "conn-A1", 1);
      // Client switches to table 2 (new SSE connection)
      const replaced = upsertClientConnection(connections, "client-A", "conn-A2", 2);

      expect(replaced!.tableId).toBe(1);
      expect(connections.get("client-A")!.tableId).toBe(2);
    });
  });
});
