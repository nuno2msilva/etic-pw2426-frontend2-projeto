import {
  disconnectCustomerConnectionsByJti,
  disconnectCustomerConnectionsByTableId,
  resolveTrackedTableId,
  upsertClientConnection,
} from "../../server/src/events";

describe("Does the SSE system track who's really at which table?", () => {
  it("trusts the server's authenticated table ID over the client's request", () => {
    expect(resolveTrackedTableId(1, 2)).toBe(2);
    expect(resolveTrackedTableId(4, 9)).toBe(9);
    expect(resolveTrackedTableId(9, 1)).toBe(1);
  });

  it("stops tracking when there's no authenticated customer table", () => {
    expect(resolveTrackedTableId(2, null)).toBeNull();
    expect(resolveTrackedTableId(null, null)).toBeNull();
  });

  it("goes silent when no table was requested — like after logout", () => {
    expect(resolveTrackedTableId(null, 2)).toBeNull();
    expect(resolveTrackedTableId(null, 9)).toBeNull();
  });

  it("swaps to the new connection when a client reconnects to a different table", () => {
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

  it("keeps each client's connection state completely isolated", () => {
    const connections = new Map<string, { connection: string; tableId: number | null }>();

    upsertClientConnection(connections, "client-a", "conn-a1", 2);
    upsertClientConnection(connections, "client-b", "conn-b1", 7);

    expect(connections.get("client-a")).toEqual({ connection: "conn-a1", tableId: 2 });
    expect(connections.get("client-b")).toEqual({ connection: "conn-b1", tableId: 7 });
  });

  it("doesn't crash when disconnecting a JTI that was never connected", () => {
    expect(disconnectCustomerConnectionsByJti("missing-jti")).toBe(0);
  });

  it("doesn't crash when disconnecting a table ID that has no connections", () => {
    expect(disconnectCustomerConnectionsByTableId(999)).toBe(0);
  });

  it("returns 0 for invalid table IDs without crashing", () => {
    expect(disconnectCustomerConnectionsByTableId(NaN)).toBe(0);
    expect(disconnectCustomerConnectionsByTableId(0)).toBe(0);
  });
});
