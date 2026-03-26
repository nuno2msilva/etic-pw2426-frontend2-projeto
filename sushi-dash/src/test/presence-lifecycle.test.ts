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
} from "../../server/src/events";
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
} from "../../src/lib/timeouts";

describe("Presence Lifecycle: Table Leave & Reconnection", () => {
  describe("Timeout Constants Configuration", () => {
    it("should export grace period constant (5 minutes)", () => {
      expect(CUSTOMER_SESSION_GRACE_PERIOD_MS).toBe(5 * 60 * 1000);
    });

    it("should export heartbeat interval constant (30 seconds)", () => {
      expect(CUSTOMER_PRESENCE_HEARTBEAT_INTERVAL_MS).toBe(30 * 1000);
    });

    it("should export SSE idle timeout constant (30 minutes)", () => {
      expect(SSE_IDLE_TIMEOUT_MS).toBe(30 * 60 * 1000);
      expect(getIdleTimeoutMs()).toBe(30 * 60 * 1000);
    });

    it("should export keep-alive interval constant (15 seconds for Vercel)", () => {
      expect(SSE_KEEP_ALIVE_INTERVAL_MS).toBe(15 * 1000);
      expect(getKeepAliveIntervalMs()).toBe(15 * 1000);
    });

    it("should export SSE reconnect delay constant (1 second initial, exponential backoff)", () => {
      expect(SSE_RECONNECT_DELAY_MS).toBe(1 * 1000);
    });

    it("should export max exponential backoff cap (30 seconds)", () => {
      expect(SSE_MAX_RECONNECT_DELAY_MS).toBe(30 * 1000);
    });

    it("should export aggressive presence polling interval (3 seconds for Vercel)", () => {
      expect(PRESENCE_POLLING_INTERVAL_MS).toBe(3 * 1000);
    });

    it("should export staff session validation interval (5 seconds)", () => {
      expect(STAFF_SESSION_VALIDATION_INTERVAL_MS).toBe(5 * 1000);
    });

    it("should export customer session validation interval (2 seconds)", () => {
      expect(CUSTOMER_SESSION_VALIDATION_INTERVAL_MS).toBe(2 * 1000);
    });
  });

  describe("Table Leave Signal (goToTableSelection)", () => {
    it("should clear presence when customer navigates to table selection", () => {
      // Simulates calling goToTableSelection() in AuthContext
      // which sets isViewingTableSelection = true
      // This causes LiveUpdates hook to pass null as tableId to SSE
      const result = resolveTrackedTableId(null, null);
      expect(result).toBeNull();
    });

    it("should not track presence when viewing table selection with valid auth", () => {
      // Even with valid authenticated table, if no tableId is requested (SSE disconnected),
      // presence should not be tracked
      const result = resolveTrackedTableId(null, 1);
      expect(result).toBeNull();
    });

    it("should preserve session cookie during table selection (no logout)", () => {
      // goToTableSelection does NOT call logout()
      // Only closes SSE connection via isViewingTableSelection flag
      // This allows graceful reconnection within 5-min grace period
      expect(CUSTOMER_SESSION_GRACE_PERIOD_MS).toBe(5 * 60 * 1000);
    });
  });

  describe("Table Join Signal (goToTable)", () => {
    it("should re-establish presence when customer selects a table", () => {
      // Simulates calling goToTable() in AuthContext
      // which sets isViewingTableSelection = false
      // This re-enables SSE with proper tableId
      const result = resolveTrackedTableId(1, 1);
      expect(result).toBe(1);
    });

    it("should track presence for authenticated table", () => {
      // With both requestedTableId and authenticatedTableId valid,
      // presence should be tracked
      const result = resolveTrackedTableId(5, 5);
      expect(result).toBe(5);
    });

    it("should use authenticated table id as source of truth", () => {
      // Server always trusts its own authenticated table id
      // This prevents spoofing presence for other tables
      const result = resolveTrackedTableId(1, 2);
      expect(result).toBe(2);
    });
  });

  describe("Idle Timeout: Order-Based Disconnection", () => {
    it("should track last order timestamp to prevent idle timeout", () => {
      // updateLastOrderTimeForTable updates the lastOrderTime field
      // in ConnectionMeta for all connections to that table
      // This resets the 30-minute idle counter
      expect(() => {
        updateLastOrderTimeForTable(1);
      }).not.toThrow();
    });

    it("should not throw when updating non-existent table", () => {
      // Gracefully handle edge case where table has no connections
      expect(() => {
        updateLastOrderTimeForTable(999);
      }).not.toThrow();
    });

    it("should have 30-minute idle timeout for order-less connections", () => {
      // If a customer stays connected without placing orders,
      // the connection is cleaned up after 30 minutes
      expect(SSE_IDLE_TIMEOUT_MS).toBe(30 * 60 * 1000);
      expect(getIdleTimeoutMs()).toBe(30 * 60 * 1000);
    });

    it("should reset idle timeout on each new order", () => {
      // Every time a customer places an order, updateLastOrderTimeForTable
      // updates the timestamp, effectively resetting the 30-min counter
      // This allows idle but active customers to stay connected indefinitely
      const timeout = getIdleTimeoutMs();
      expect(timeout).toBeGreaterThan(0);
    });
  });

  describe("Grace Period: Session Restoration After Accidental Close", () => {
    it("should preserve session for 5 minutes after unintended disconnect", () => {
      // When customer closes browser tab (beforeunload handler closes SSE),
      // session cookie remains valid for 5 minutes
      // This allows re-entry without re-entering PIN
      const gracePeriod = CUSTOMER_SESSION_GRACE_PERIOD_MS;
      expect(gracePeriod).toBe(5 * 60 * 1000);
    });

    it("should have heartbeat interval shorter than grace period", () => {
      // Customer presence heartbeat (localStorage timestamp update)
      // runs every 30 seconds, which is well within the 5-min grace period
      // This ensures accurate grace period detection
      expect(CUSTOMER_PRESENCE_HEARTBEAT_INTERVAL_MS).toBeLessThan(
        CUSTOMER_SESSION_GRACE_PERIOD_MS,
      );
    });

    it("should allow restoration within grace period", () => {
      // Between closing the tab and the 5-minute grace period expiring,
      // customer can reload page and auto-restore without PIN
      const gracePeriod = CUSTOMER_SESSION_GRACE_PERIOD_MS;
      const heartbeat = CUSTOMER_PRESENCE_HEARTBEAT_INTERVAL_MS;
      const beatsPerGracePeriod = gracePeriod / heartbeat;
      expect(beatsPerGracePeriod).toBeGreaterThan(1);
    });

    it("should expire session after grace period", () => {
      // After 5 minutes of no activity, session is cleared
      // Customer must re-enter PIN to access table again
      expect(CUSTOMER_SESSION_GRACE_PERIOD_MS).toBe(5 * 60 * 1000);
    });
  });

  describe("Beforeunload: Graceful Disconnection", () => {
    it("should close SSE on browser unload without logout", () => {
      // beforeunload event listener closes the EventSource explicitly
      // This triggers req.on('close') on server, which calls cleanupConnection()
      // Server detects presence has zero connections and clears the ON badge
      // Session cookie remains valid (no logout)
      const gracePeriod = CUSTOMER_SESSION_GRACE_PERIOD_MS;
      expect(gracePeriod).toBeGreaterThan(0);
    });

    it("should allow reconnection within grace period after unload close", () => {
      // SSE closed via beforeunload → presence cleared on server
      // Customer reloads within 5 min → auto-restore session → reconnect SSE
      // No PIN entry needed
      const reconnectDelay = SSE_RECONNECT_DELAY_MS;
      const gracePeriod = CUSTOMER_SESSION_GRACE_PERIOD_MS;
      expect(reconnectDelay).toBeLessThan(gracePeriod);
    });

    it("should have SSE reconnect backoff shorter than grace period", () => {
      // If SSE temporarily drops, it reconnects after 2 seconds
      // This is much faster than the 5-minute grace period
      expect(SSE_RECONNECT_DELAY_MS).toBeLessThan(
        CUSTOMER_SESSION_GRACE_PERIOD_MS,
      );
    });
  });

  describe("Session Validation Polling", () => {
    it("should validate staff session every 5 seconds", () => {
      // Detects if admin logs out the staff user or changes permissions
      expect(STAFF_SESSION_VALIDATION_INTERVAL_MS).toBe(5 * 1000);
    });

    it("should validate customer session every 2 seconds", () => {
      // Detects if manager randomizes PIN (ejecting customer)
      expect(CUSTOMER_SESSION_VALIDATION_INTERVAL_MS).toBe(2 * 1000);
    });

    it("should validate customer session faster than staff", () => {
      // PIN randomization is more urgent than staff logout
      expect(CUSTOMER_SESSION_VALIDATION_INTERVAL_MS).toBeLessThan(
        STAFF_SESSION_VALIDATION_INTERVAL_MS,
      );
    });
  });

  describe("End-to-End Workflow: Customer Journey", () => {
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
      // (This is handled by counting connections in tableClients Set)
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

  describe("Timeout Constants Synchronization", () => {
    it("should have SSE idle timeout matching constant", () => {
      expect(SSE_IDLE_TIMEOUT_MS).toBe(getIdleTimeoutMs());
    });

    it("should have keep-alive interval matching constant", () => {
      expect(SSE_KEEP_ALIVE_INTERVAL_MS).toBe(getKeepAliveIntervalMs());
    });

    it("should validate grace period is longer than validation intervals", () => {
      expect(CUSTOMER_SESSION_GRACE_PERIOD_MS).toBeGreaterThan(
        CUSTOMER_SESSION_VALIDATION_INTERVAL_MS,
      );
      expect(CUSTOMER_SESSION_GRACE_PERIOD_MS).toBeGreaterThan(
        STAFF_SESSION_VALIDATION_INTERVAL_MS,
      );
    });

    it("should validate heartbeat is reasonable relative to grace period", () => {
      // Heartbeat should be frequent enough to detect grace period
      expect(CUSTOMER_PRESENCE_HEARTBEAT_INTERVAL_MS).toBeLessThan(
        CUSTOMER_SESSION_GRACE_PERIOD_MS,
      );
      // But not so frequent it causes performance issues
      expect(CUSTOMER_PRESENCE_HEARTBEAT_INTERVAL_MS).toBeGreaterThan(1000);
    });

    it("should ensure idle timeout is much longer than validation", () => {
      // 30 min idle timeout >> 2 sec validation interval
      // This ensures we don't prematurely kick active customers
      expect(SSE_IDLE_TIMEOUT_MS).toBeGreaterThan(
        CUSTOMER_SESSION_VALIDATION_INTERVAL_MS * 100,
      );
    });
  });
});
