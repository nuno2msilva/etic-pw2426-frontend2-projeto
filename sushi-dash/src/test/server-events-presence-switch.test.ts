import { upsertClientConnection } from "../../server/src/events";

describe("SSE client presence switching", () => {
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
});
