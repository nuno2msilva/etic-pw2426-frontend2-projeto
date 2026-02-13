/**
 * ==========================================================================
 * Order Status Constants Unit Tests
 * ==========================================================================
 *
 * Tests the shared order-status display maps (lib/order-status.ts):
 *   - STATUS_BADGE_VARIANT — maps each OrderStatus to a badge variant
 *   - STATUS_LABELS — maps each OrderStatus to an emoji + label string
 *
 * Testing Framework: Jest
 * ==========================================================================
 */

import { STATUS_BADGE_VARIANT, STATUS_LABELS } from "@/lib/order-status";
import type { OrderStatus } from "@/types/sushi";

const ALL_STATUSES: OrderStatus[] = [
  "queued",
  "preparing",
  "ready",
  "delivered",
  "cancelled",
];

// ==========================================================================
// STATUS_BADGE_VARIANT
// ==========================================================================
describe("STATUS_BADGE_VARIANT", () => {
  it("has an entry for every OrderStatus", () => {
    for (const status of ALL_STATUSES) {
      expect(STATUS_BADGE_VARIANT[status]).toBeDefined();
    }
  });

  it("maps to correct badge variants", () => {
    expect(STATUS_BADGE_VARIANT.queued).toBe("accent");
    expect(STATUS_BADGE_VARIANT.preparing).toBe("primary-soft");
    expect(STATUS_BADGE_VARIANT.ready).toBe("success");
    expect(STATUS_BADGE_VARIANT.delivered).toBe("muted");
    expect(STATUS_BADGE_VARIANT.cancelled).toBe("destructive");
  });

  it("has no extra keys beyond known statuses", () => {
    const keys = Object.keys(STATUS_BADGE_VARIANT);
    expect(keys.sort()).toEqual([...ALL_STATUSES].sort());
  });
});

// ==========================================================================
// STATUS_LABELS
// ==========================================================================
describe("STATUS_LABELS", () => {
  it("has an entry for every OrderStatus", () => {
    for (const status of ALL_STATUSES) {
      expect(STATUS_LABELS[status]).toBeDefined();
    }
  });

  it("each label is a non-empty string", () => {
    for (const status of ALL_STATUSES) {
      expect(typeof STATUS_LABELS[status]).toBe("string");
      expect(STATUS_LABELS[status].length).toBeGreaterThan(0);
    }
  });

  it("labels contain expected keywords", () => {
    expect(STATUS_LABELS.queued).toContain("Queued");
    expect(STATUS_LABELS.preparing).toContain("Preparing");
    expect(STATUS_LABELS.ready).toContain("Ready");
    expect(STATUS_LABELS.delivered).toContain("Delivered");
    expect(STATUS_LABELS.cancelled).toContain("Cancelled");
  });

  it("each label contains an emoji prefix", () => {
    // Each label should start with a non-ASCII character (emoji)
    for (const status of ALL_STATUSES) {
      const firstChar = STATUS_LABELS[status].codePointAt(0)!;
      expect(firstChar).toBeGreaterThan(127);
    }
  });

  it("has no extra keys beyond known statuses", () => {
    const keys = Object.keys(STATUS_LABELS);
    expect(keys.sort()).toEqual([...ALL_STATUSES].sort());
  });
});
