import { stabilizePresenceSnapshot } from "@/features/shared/hooks/useTablePresence";

describe("Does the presence indicator stay steady or flicker like a broken bulb?", () => {
  it("keeps the table lit during brief empty-snapshot blips", () => {
    const lastSeenAt = new Map<number, number>();
    const now = 1_000;

    const initial = stabilizePresenceSnapshot({ 3: 1 }, {}, lastSeenAt, now, 12_000);
    expect(initial[3]).toBe(1);

    const shortDrop = stabilizePresenceSnapshot({}, initial, lastSeenAt, now + 2_000, 12_000);
    expect(shortDrop[3]).toBe(1);
  });

  it("finally dims the table after the grace window runs out", () => {
    const lastSeenAt = new Map<number, number>();
    const now = 5_000;

    const initial = stabilizePresenceSnapshot({ 5: 2 }, {}, lastSeenAt, now, 12_000);
    expect(initial[5]).toBe(2);

    const expired = stabilizePresenceSnapshot({}, initial, lastSeenAt, now + 12_001, 12_000);
    expect(expired[5]).toBeUndefined();
  });

  it("resets the clock every time the table reports activity", () => {
    const lastSeenAt = new Map<number, number>();

    const first = stabilizePresenceSnapshot({ 8: 1 }, {}, lastSeenAt, 10_000, 12_000);
    expect(first[8]).toBe(1);

    const second = stabilizePresenceSnapshot({ 8: 3 }, first, lastSeenAt, 15_000, 12_000);
    expect(second[8]).toBe(3);

    const withinGrace = stabilizePresenceSnapshot({}, second, lastSeenAt, 25_000, 12_000);
    expect(withinGrace[8]).toBe(3);
  });

  it("doesn't lose an occupied table when an empty snapshot arrives between polls", () => {
    // Simulates the old bug: SSE broadcast sends in-memory-only data (0 connections)
    // while DB heartbeats are still valid. The next merged poll restores the count.
    const lastSeenAt = new Map<number, number>();
    const GRACE = 5_000;

    // Poll 1: merged endpoint says table 4 has 1 customer
    const poll1 = stabilizePresenceSnapshot({ 4: 1 }, {}, lastSeenAt, 1_000, GRACE);
    expect(poll1[4]).toBe(1);

    // SSE event arrives 500ms later with empty data (in-memory only, no DB)
    // Because SSE now invalidates instead of setQueryData, this wouldn't happen.
    // But even if it did, the grace period keeps the table ON:
    const sseDrop = stabilizePresenceSnapshot({}, poll1, lastSeenAt, 1_500, GRACE);
    expect(sseDrop[4]).toBe(1); // Still ON — within grace period

    // Poll 2 arrives 3s later with merged data confirming the table is occupied
    const poll2 = stabilizePresenceSnapshot({ 4: 1 }, sseDrop, lastSeenAt, 4_000, GRACE);
    expect(poll2[4]).toBe(1); // Confirmed ON
  });

  it("handles rapid SSE-then-poll sequences without false negatives", () => {
    const lastSeenAt = new Map<number, number>();
    const GRACE = 5_000;

    // Table is occupied
    const s1 = stabilizePresenceSnapshot({ 7: 2 }, {}, lastSeenAt, 10_000, GRACE);
    expect(s1[7]).toBe(2);

    // SSE broadcasts empty (connection dropped)
    const s2 = stabilizePresenceSnapshot({}, s1, lastSeenAt, 10_100, GRACE);
    expect(s2[7]).toBe(2); // Grace keeps it ON

    // Another SSE broadcast empty
    const s3 = stabilizePresenceSnapshot({}, s2, lastSeenAt, 10_200, GRACE);
    expect(s3[7]).toBe(2); // Still ON

    // Merged poll confirms presence
    const s4 = stabilizePresenceSnapshot({ 7: 2 }, s3, lastSeenAt, 13_000, GRACE);
    expect(s4[7]).toBe(2); // Back to authoritative data
  });
});
