/** Order status tests — badge variant mapping, status labels, emoji prefixes */

import { STATUS_BADGE_VARIANT, STATUS_LABELS } from "@/features/shared/lib/order-status";
import type { OrderStatus } from "@/features/shared/types/models";

const ALL_STATUSES: OrderStatus[] = [
  "queued",
  "preparing",
  "ready",
  "delivered",
  "cancelled",
];

describe("Do order statuses get the right badge color or just wing it?", () => {
  it("every status has a badge variant assigned", () => {
    for (const status of ALL_STATUSES) {
      expect(STATUS_BADGE_VARIANT[status]).toBeDefined();
    }
  });

  it("maps each status to its correct color personality", () => {
    expect(STATUS_BADGE_VARIANT.queued).toBe("accent");
    expect(STATUS_BADGE_VARIANT.preparing).toBe("primary-soft");
    expect(STATUS_BADGE_VARIANT.ready).toBe("success");
    expect(STATUS_BADGE_VARIANT.delivered).toBe("muted");
    expect(STATUS_BADGE_VARIANT.cancelled).toBe("destructive");
  });

  it("no mystery keys lurking in the badge map", () => {
    const keys = Object.keys(STATUS_BADGE_VARIANT);
    expect(keys.sort()).toEqual([...ALL_STATUSES].sort());
  });
});

describe("Do status labels actually say something useful?", () => {
  it("every status has a human-readable label", () => {
    for (const status of ALL_STATUSES) {
      expect(STATUS_LABELS[status]).toBeDefined();
    }
  });

  it("labels are non-empty strings (not blank stares)", () => {
    for (const status of ALL_STATUSES) {
      expect(typeof STATUS_LABELS[status]).toBe("string");
      expect(STATUS_LABELS[status].length).toBeGreaterThan(0);
    }
  });

  it("labels contain the right keywords — no identity crisis", () => {
    expect(STATUS_LABELS.queued).toContain("Queued");
    expect(STATUS_LABELS.preparing).toContain("Preparing");
    expect(STATUS_LABELS.ready).toContain("Ready");
    expect(STATUS_LABELS.delivered).toContain("Delivered");
    expect(STATUS_LABELS.cancelled).toContain("Cancelled");
  });

  it("every label leads with an emoji because we have standards", () => {
    // Each label should start with a non-ASCII character (emoji)
    for (const status of ALL_STATUSES) {
      const firstChar = STATUS_LABELS[status].codePointAt(0)!;
      expect(firstChar).toBeGreaterThan(127);
    }
  });

  it("no rogue keys sneaking into the label map", () => {
    const keys = Object.keys(STATUS_LABELS);
    expect(keys.sort()).toEqual([...ALL_STATUSES].sort());
  });
});
