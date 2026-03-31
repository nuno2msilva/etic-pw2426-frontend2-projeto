import { stabilizePresenceSnapshot } from "@/features/shared/hooks/useTablePresence";

describe("table presence stability", () => {
  it("keeps table ON during short empty snapshots", () => {
    const lastSeenAt = new Map<number, number>();
    const now = 1_000;

    const initial = stabilizePresenceSnapshot({ 3: 1 }, {}, lastSeenAt, now, 12_000);
    expect(initial[3]).toBe(1);

    const shortDrop = stabilizePresenceSnapshot({}, initial, lastSeenAt, now + 2_000, 12_000);
    expect(shortDrop[3]).toBe(1);
  });

  it("turns table OFF after grace window expires", () => {
    const lastSeenAt = new Map<number, number>();
    const now = 5_000;

    const initial = stabilizePresenceSnapshot({ 5: 2 }, {}, lastSeenAt, now, 12_000);
    expect(initial[5]).toBe(2);

    const expired = stabilizePresenceSnapshot({}, initial, lastSeenAt, now + 12_001, 12_000);
    expect(expired[5]).toBeUndefined();
  });

  it("refreshes last-seen when table remains active", () => {
    const lastSeenAt = new Map<number, number>();

    const first = stabilizePresenceSnapshot({ 8: 1 }, {}, lastSeenAt, 10_000, 12_000);
    expect(first[8]).toBe(1);

    const second = stabilizePresenceSnapshot({ 8: 3 }, first, lastSeenAt, 15_000, 12_000);
    expect(second[8]).toBe(3);

    const withinGrace = stabilizePresenceSnapshot({}, second, lastSeenAt, 25_000, 12_000);
    expect(withinGrace[8]).toBe(3);
  });
});
