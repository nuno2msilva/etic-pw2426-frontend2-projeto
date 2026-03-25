import {
  disconnectCustomerConnectionsByJti,
  resolveTrackedTableId,
  upsertClientConnection,
} from "../../server/src/events";

describe("SSE client presence switching", () => {
  it("tracks authenticated customer table id instead of requested query table id", () => {
    expect(resolveTrackedTableId(1, 2)).toBe(2);
    expect(resolveTrackedTableId(4, 9)).toBe(9);
    expect(resolveTrackedTableId(9, 1)).toBe(1);
  });

  it("does not track presence when there is no authenticated customer table", () => {
    expect(resolveTrackedTableId(2, null)).toBeNull();
    expect(resolveTrackedTableId(null, null)).toBeNull();
  });

  it("does not track presence when no tableId was requested (e.g. selector after logout)", () => {
    expect(resolveTrackedTableId(null, 2)).toBeNull();
    expect(resolveTrackedTableId(null, 9)).toBeNull();
  });

  it("replaces prior connection regardless of table id sequence", () => {
    const connections = new Map<string, { connection: string; tableId: number | null }>();

    const first = upsertClientConnection(connections, "client-a", "conn-1", 1);
    expect(first).toBeNull();
    expect(connections.get("client-a")).toEqual({ connection: "conn-1", tableId: 1 });

    const second = upsertClientConnection(connections, "client-a", "conn-2", 4);
    expect(second).toEqual({ connection: "conn-1", tableId: 1 });
    expect(connections.get("client-a")).toEqual({ connection: "conn-2", tableId: 4 });

    const third = upsertClientConnection(connections, "client-a", "conn-3", 9);
    expect(third).toEqual({ connection: "conn-2", tableId: 4 });
    expect(connections.get("client-a")).toEqual({ connection: "conn-3", tableId: 9 });

    const fourth = upsertClientConnection(connections, "client-a", "conn-4", 1);
    expect(fourth).toEqual({ connection: "conn-3", tableId: 9 });
    expect(connections.get("client-a")).toEqual({ connection: "conn-4", tableId: 1 });
  });

  it("keeps independent state per client id", () => {
    const connections = new Map<string, { connection: string; tableId: number | null }>();

    upsertClientConnection(connections, "client-a", "conn-a1", 2);
    upsertClientConnection(connections, "client-b", "conn-b1", 7);

    expect(connections.get("client-a")).toEqual({ connection: "conn-a1", tableId: 2 });
    expect(connections.get("client-b")).toEqual({ connection: "conn-b1", tableId: 7 });
  });

  it("no-ops disconnect by jti when there are no tracked connections", () => {
    expect(disconnectCustomerConnectionsByJti("missing-jti")).toBe(0);
  });
});
