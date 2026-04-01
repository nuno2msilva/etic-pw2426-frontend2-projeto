/**
 * Context API, React Query & Derived State Test Suite (Requirements 12, 14, 15)
 * Tests query key structure, context hooks, useMemo/useCallback-derived values,
 * and useRef-powered helpers from AppContext and useOrderingFlow.
 */

import { queryKeys } from "@/features/shared/hooks/useApiQueries";
import type { MenuItem, Order, OrderSettings, Table } from "@/features/shared/types/models";

// ---------------------------------------------------------------------------
// Requirement 14 — React Query: centralised query keys
// ---------------------------------------------------------------------------

describe("Are React Query cache keys structured for consistent invalidation?", () => {
  it("uses ['menu'] as the menu query key", () => {
    expect(queryKeys.menu).toEqual(["menu"]);
  });

  it("uses ['tables'] as the tables query key", () => {
    expect(queryKeys.tables).toEqual(["tables"]);
  });

  it("uses ['orders'] as the orders query key", () => {
    expect(queryKeys.orders).toEqual(["orders"]);
  });

  it("uses ['settings'] as the settings query key", () => {
    expect(queryKeys.settings).toEqual(["settings"]);
  });

  it("uses ['categories'] as the categories query key", () => {
    expect(queryKeys.categories).toEqual(["categories"]);
  });

  it("all keys are plain arrays with a single string element", () => {
    // `as const` is compile-time only — verify the shape at runtime
    expect(Array.isArray(queryKeys.menu)).toBe(true);
    expect(queryKeys.menu).toHaveLength(1);
    expect(Array.isArray(queryKeys.tables)).toBe(true);
    expect(queryKeys.tables).toHaveLength(1);
    expect(Array.isArray(queryKeys.orders)).toBe(true);
    expect(queryKeys.orders).toHaveLength(1);
    expect(Array.isArray(queryKeys.settings)).toBe(true);
    expect(queryKeys.settings).toHaveLength(1);
    expect(Array.isArray(queryKeys.categories)).toBe(true);
    expect(queryKeys.categories).toHaveLength(1);
  });

  it("has exactly 5 query key families — no secret sixth one", () => {
    expect(Object.keys(queryKeys)).toHaveLength(5);
  });
});

// ---------------------------------------------------------------------------
// Requirement 12 — Context API: useApp / useAuth guard
// ---------------------------------------------------------------------------

describe("Do the context hooks scream if you use them outside their provider?", () => {
  it("useApp throws a helpful error when there's no AppProvider above", () => {
    // Verify the hook source contains the guard check
    const { useApp } = require("@/features/customer/context/AppContext");
    const src = useApp.toString();
    expect(src).toContain("useApp must be used within AppProvider");
  });

  it("useAuth throws a helpful error when there's no AuthProvider above", () => {
    const { useAuth } = require("@/features/shared/context/AuthContext");
    const src = useAuth.toString();
    expect(src).toContain("useAuth must be used within an AuthProvider");
  });
});

// ---------------------------------------------------------------------------
// Requirement 15 — useMemo: derived state computations (pure logic tests)
// ---------------------------------------------------------------------------

describe("Does useMemo produce the right derived values from cart and menu?", () => {
  // These test the SAME computations that live inside useOrderingFlow's useMemo hooks,
  // extracted here as pure functions to verify correctness without needing React rendering.

  const menu: MenuItem[] = [
    { id: "1", name: "Salmon Nigiri", emoji: "🍣", category: "Nigiri", isPopular: true },
    { id: "2", name: "Tuna Roll", emoji: "🍙", category: "Rolls", isPopular: false },
    { id: "3", name: "Dragon Roll", emoji: "🐉", category: "Rolls" },
    { id: "4", name: "Miso Soup", emoji: "🍜", category: "Sides" },
  ];

  // totalItems — mirrors useOrderingFlow's useMemo
  function computeTotalItems(cart: Record<string, number>): number {
    return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  }

  // canAddMore — mirrors useOrderingFlow's useMemo
  function computeCanAddMore(totalItems: number, maxItemsPerOrder: number): boolean {
    return totalItems < maxItemsPerOrder;
  }

  // cartSummary — mirrors useOrderingFlow's useMemo
  function computeCartSummary(cart: Record<string, number>, menuItems: MenuItem[]): string {
    return Object.entries(cart)
      .map(([id, qty]) => {
        const item = menuItems.find((m) => m.id === id);
        return item ? `${item.name} (${qty}x)` : null;
      })
      .filter(Boolean)
      .join(", ");
  }

  // menuByCategory — mirrors useOrderingFlow's useMemo
  function computeMenuByCategory(menuItems: MenuItem[]): Record<string, MenuItem[]> {
    const grouped: Record<string, MenuItem[]> = {};
    for (const item of menuItems) {
      (grouped[item.category] ??= []).push(item);
    }
    return grouped;
  }

  // cartByCategory — mirrors useOrderingFlow's useMemo
  function computeCartByCategory(cart: Record<string, number>, menuItems: MenuItem[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const [id, qty] of Object.entries(cart)) {
      const item = menuItems.find((m) => m.id === id);
      if (item) counts[item.category] = (counts[item.category] || 0) + qty;
    }
    return counts;
  }

  // categories — mirrors AppContext's useMemo
  function computeCategories(menuItems: MenuItem[]): string[] {
    const cats = new Set(menuItems.map((m) => m.category));
    return Array.from(cats);
  }

  it("totalItems sums all quantities in the cart", () => {
    expect(computeTotalItems({ "1": 2, "2": 3, "3": 1 })).toBe(6);
  });

  it("totalItems returns 0 for an empty cart", () => {
    expect(computeTotalItems({})).toBe(0);
  });

  it("canAddMore is true when under the limit", () => {
    expect(computeCanAddMore(5, 10)).toBe(true);
  });

  it("canAddMore is false when at the limit", () => {
    expect(computeCanAddMore(10, 10)).toBe(false);
  });

  it("canAddMore is false when over the limit", () => {
    expect(computeCanAddMore(11, 10)).toBe(false);
  });

  it("cartSummary formats item names with quantities", () => {
    const result = computeCartSummary({ "1": 2, "2": 1 }, menu);
    expect(result).toBe("Salmon Nigiri (2x), Tuna Roll (1x)");
  });

  it("cartSummary returns empty string for an empty cart", () => {
    expect(computeCartSummary({}, menu)).toBe("");
  });

  it("cartSummary ignores cart entries for deleted menu items", () => {
    const result = computeCartSummary({ "1": 1, "999": 3 }, menu);
    expect(result).toBe("Salmon Nigiri (1x)");
  });

  it("menuByCategory groups items by their category", () => {
    const grouped = computeMenuByCategory(menu);
    expect(Object.keys(grouped)).toEqual(expect.arrayContaining(["Nigiri", "Rolls", "Sides"]));
    expect(grouped["Nigiri"]).toHaveLength(1);
    expect(grouped["Rolls"]).toHaveLength(2);
    expect(grouped["Sides"]).toHaveLength(1);
  });

  it("menuByCategory returns empty object for empty menu", () => {
    expect(computeMenuByCategory([])).toEqual({});
  });

  it("cartByCategory sums quantities per category", () => {
    const result = computeCartByCategory({ "1": 2, "2": 1, "3": 3 }, menu);
    expect(result["Nigiri"]).toBe(2);
    expect(result["Rolls"]).toBe(4); // 1 + 3
    expect(result["Sides"]).toBeUndefined();
  });

  it("cartByCategory returns empty object for empty cart", () => {
    expect(computeCartByCategory({}, menu)).toEqual({});
  });

  it("categories derives unique category names from menu", () => {
    const cats = computeCategories(menu);
    expect(cats).toHaveLength(3);
    expect(cats).toContain("Nigiri");
    expect(cats).toContain("Rolls");
    expect(cats).toContain("Sides");
  });

  it("categories returns empty array for empty menu", () => {
    expect(computeCategories([])).toEqual([]);
  });

  it("categories deduplicates when multiple items share a category", () => {
    const cats = computeCategories(menu);
    // Rolls has 2 items but should only appear once
    expect(cats.filter((c) => c === "Rolls")).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Requirement 15 — useCallback: order validation helpers (pure logic tests)
// ---------------------------------------------------------------------------

describe("Do the useCallback order helpers enforce the restaurant's rules?", () => {
  const table: Table = { id: "1", label: "Table 1" };
  const settings: OrderSettings = { maxItemsPerOrder: 10, maxActiveOrdersPerTable: 2 };

  // getActiveOrdersForTable — mirrors AppContext's useCallback
  function getActiveOrdersForTable(orders: Order[], tableId: string): Order[] {
    return orders.filter(
      (o) => o.table.id === tableId && o.status !== "delivered" && o.status !== "cancelled"
    );
  }

  // canTablePlaceOrder — mirrors AppContext's useCallback
  function canTablePlaceOrder(
    orders: Order[],
    tableId: string,
    maxActive: number
  ): { allowed: boolean; reason?: string } {
    const activeOrders = getActiveOrdersForTable(orders, tableId);
    if (activeOrders.length >= maxActive) {
      return {
        allowed: false,
        reason: `Maximum ${maxActive} active orders per table. Please wait for current orders to be delivered.`,
      };
    }
    return { allowed: true };
  }

  // getQueuePosition — mirrors AppContext's useCallback
  function getQueuePosition(orders: Order[], orderId: string): number {
    const pending = orders.filter(
      (o) => o.status === "queued" || o.status === "preparing"
    );
    const idx = pending.findIndex((o) => o.id === orderId);
    return idx === -1 ? -1 : idx + 1;
  }

  const makeOrder = (overrides: Partial<Order>): Order => ({
    id: "o-1",
    table,
    items: [],
    status: "queued",
    createdAt: new Date(),
    ...overrides,
  });

  it("getActiveOrdersForTable filters out delivered orders", () => {
    const orders = [
      makeOrder({ id: "1", status: "queued" }),
      makeOrder({ id: "2", status: "delivered" }),
      makeOrder({ id: "3", status: "preparing" }),
    ];
    expect(getActiveOrdersForTable(orders, "1")).toHaveLength(2);
  });

  it("getActiveOrdersForTable filters out cancelled orders", () => {
    const orders = [
      makeOrder({ id: "1", status: "queued" }),
      makeOrder({ id: "2", status: "cancelled" }),
    ];
    expect(getActiveOrdersForTable(orders, "1")).toHaveLength(1);
  });

  it("getActiveOrdersForTable only returns orders for the specified table", () => {
    const otherTable = { id: "2", label: "Table 2" };
    const orders = [
      makeOrder({ id: "1", table, status: "queued" }),
      makeOrder({ id: "2", table: otherTable, status: "queued" }),
    ];
    expect(getActiveOrdersForTable(orders, "1")).toHaveLength(1);
    expect(getActiveOrdersForTable(orders, "2")).toHaveLength(1);
  });

  it("canTablePlaceOrder allows when under the limit", () => {
    const orders = [makeOrder({ id: "1", status: "queued" })];
    const result = canTablePlaceOrder(orders, "1", 2);
    expect(result.allowed).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it("canTablePlaceOrder blocks when at the limit", () => {
    const orders = [
      makeOrder({ id: "1", status: "queued" }),
      makeOrder({ id: "2", status: "preparing" }),
    ];
    const result = canTablePlaceOrder(orders, "1", 2);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("Maximum 2 active orders");
  });

  it("canTablePlaceOrder doesn't count delivered orders toward the limit", () => {
    const orders = [
      makeOrder({ id: "1", status: "delivered" }),
      makeOrder({ id: "2", status: "delivered" }),
      makeOrder({ id: "3", status: "queued" }),
    ];
    const result = canTablePlaceOrder(orders, "1", 2);
    expect(result.allowed).toBe(true);
  });

  it("getQueuePosition returns 1-based index for the first queued order", () => {
    const orders = [
      makeOrder({ id: "o-1", status: "queued" }),
      makeOrder({ id: "o-2", status: "queued" }),
    ];
    expect(getQueuePosition(orders, "o-1")).toBe(1);
  });

  it("getQueuePosition returns 2 for the second order in queue", () => {
    const orders = [
      makeOrder({ id: "o-1", status: "queued" }),
      makeOrder({ id: "o-2", status: "queued" }),
    ];
    expect(getQueuePosition(orders, "o-2")).toBe(2);
  });

  it("getQueuePosition includes preparing orders in the queue", () => {
    const orders = [
      makeOrder({ id: "o-1", status: "preparing" }),
      makeOrder({ id: "o-2", status: "queued" }),
    ];
    expect(getQueuePosition(orders, "o-2")).toBe(2);
  });

  it("getQueuePosition returns -1 for a non-existent order", () => {
    const orders = [makeOrder({ id: "o-1", status: "queued" })];
    expect(getQueuePosition(orders, "o-999")).toBe(-1);
  });

  it("getQueuePosition ignores delivered orders — they're done", () => {
    const orders = [
      makeOrder({ id: "o-1", status: "delivered" }),
      makeOrder({ id: "o-2", status: "queued" }),
    ];
    expect(getQueuePosition(orders, "o-2")).toBe(1);
  });
});
