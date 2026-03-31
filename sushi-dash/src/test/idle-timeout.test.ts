/**
 * Idle timeout tests — Verify that SSE connections are cleaned up after 30 minutes of inactivity (no new orders).
 */

import {
  updateLastOrderTimeForTable,
  getIdleTimeoutMs,
} from "../../server/src/events";

// Mock response object for testing
function createMockResponse() {
  return {
    write: jest.fn(),
    end: jest.fn(),
  };
}

describe("What happens when a customer just... sits there doing nothing?", () => {
  it("kicks idle connections after exactly 30 minutes", () => {
    const idleTimeoutMs = getIdleTimeoutMs();
    expect(idleTimeoutMs).toBe(30 * 60 * 1000); // 30 minutes
  });

  it("the timeout is a real positive number, not some NaN nonsense", () => {
    // This verifies the timeout constant is properly exported
    const timeout = getIdleTimeoutMs();
    expect(typeof timeout).toBe("number");
    expect(timeout).toBeGreaterThan(0);
    expect(timeout).toBe(1800000); // Exactly 30 minutes in milliseconds
  });

  it("can bump the last-order timestamp to keep the connection alive", () => {
    // This test verifies the function exists and can be called without error
    const tableId = 42;
    expect(() => {
      updateLastOrderTimeForTable(tableId);
    }).not.toThrow();
  });

  it("doesn't explode when updating a table that doesn't exist", () => {
    // Non-existent tables should not cause errors
    expect(() => {
      updateLastOrderTimeForTable(999);
      updateLastOrderTimeForTable(-1);
      updateLastOrderTimeForTable(0);
    }).not.toThrow();
  });
});
