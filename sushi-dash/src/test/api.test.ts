/**
 * ==========================================================================
 * API Layer Unit Tests
 * ==========================================================================
 *
 * Tests the mock REST API (lib/api.ts) which simulates backend CRUD
 * operations using localStorage. Covers:
 *   - Menu CRUD (fetch, create, delete)
 *   - Table CRUD (fetch, create, delete)
 *   - Order CRUD (fetch, create, update status, cancel, delete)
 *   - Settings CRUD (fetch, update)
 *
 * Testing Framework: Jest
 * ==========================================================================
 */

import * as api from "@/lib/api";
import { DEFAULT_MENU, DEFAULT_TABLES, DEFAULT_SETTINGS } from "@/data/defaultMenu";

// Clear localStorage before each test to ensure isolation
beforeEach(() => {
  localStorage.clear();
});

// ==========================================================================
// MENU API TESTS
// ==========================================================================
describe("Menu API", () => {
  it("fetchMenu returns default menu on first load", async () => {
    const menu = await api.fetchMenu();
    expect(menu).toHaveLength(DEFAULT_MENU.length);
    expect(menu[0].name).toBe(DEFAULT_MENU[0].name);
  });

  it("fetchMenu returns stored menu from localStorage", async () => {
    const custom = [{ id: "999", name: "Test Sushi", emoji: "🍣", category: "Test" }];
    localStorage.setItem("sushi-dash-api-menu", JSON.stringify(custom));

    const menu = await api.fetchMenu();
    expect(menu).toHaveLength(1);
    expect(menu[0].name).toBe("Test Sushi");
  });

  it("createMenuItem adds a new item with auto-generated ID", async () => {
    const newItem = await api.createMenuItem({
      name: "Custom Roll",
      emoji: "🍙",
      category: "Rolls",
    });

    expect(newItem.id).toBeDefined();
    expect(newItem.name).toContain("Custom Roll");
    expect(newItem.category).toBe("Rolls");

    // Verify it's persisted
    const menu = await api.fetchMenu();
    const found = menu.find((m) => m.id === newItem.id);
    expect(found).toBeDefined();
  });

  it("createMenuItem auto-numbers items without # prefix", async () => {
    const newItem = await api.createMenuItem({
      name: "New Sushi",
      emoji: "🍣",
      category: "Nigiri",
    });

    expect(newItem.name).toMatch(/^#\d+ New Sushi$/);
  });

  it("createMenuItem preserves # prefix if already present", async () => {
    const newItem = await api.createMenuItem({
      name: "#99 Special",
      emoji: "🍣",
      category: "Nigiri",
    });

    expect(newItem.name).toBe("#99 Special");
  });

  it("deleteMenuItem removes an existing item", async () => {
    // Seed the menu
    await api.fetchMenu();
    const result = await api.deleteMenuItem("1");
    expect(result).toBe(true);

    const menu = await api.fetchMenu();
    expect(menu.find((m) => m.id === "1")).toBeUndefined();
  });

  it("deleteMenuItem returns false for non-existent ID", async () => {
    const result = await api.deleteMenuItem("nonexistent");
    expect(result).toBe(false);
  });
});

// ==========================================================================
// TABLE API TESTS
// ==========================================================================
describe("Table API", () => {
  it("fetchTables returns default tables on first load", async () => {
    const tables = await api.fetchTables();
    expect(tables).toHaveLength(DEFAULT_TABLES.length);
    expect(tables[0].label).toBe("Table 1");
  });

  it("createTable adds a new table", async () => {
    const newTable = await api.createTable("VIP Table");
    expect(newTable.id).toBeDefined();
    expect(newTable.label).toBe("VIP Table");

    const tables = await api.fetchTables();
    const found = tables.find((t) => t.id === newTable.id);
    expect(found).toBeDefined();
  });

  it("deleteTable removes an existing table", async () => {
    await api.fetchTables();
    const result = await api.deleteTable("1");
    expect(result).toBe(true);

    const tables = await api.fetchTables();
    expect(tables.find((t) => t.id === "1")).toBeUndefined();
  });

  it("deleteTable returns false for non-existent ID", async () => {
    const result = await api.deleteTable("nonexistent");
    expect(result).toBe(false);
  });
});

// ==========================================================================
// ORDER API TESTS
// ==========================================================================
describe("Order API", () => {
  const mockTable = { id: "1", label: "Table 1" };
  const mockMenu = DEFAULT_MENU;
  const mockSettings = DEFAULT_SETTINGS;

  it("fetchOrders returns empty array initially", async () => {
    const orders = await api.fetchOrders();
    expect(orders).toHaveLength(0);
  });

  it("createOrder creates a new order with queued status", async () => {
    const result = await api.createOrder(
      [{ sushiId: "1", quantity: 2 }],
      mockTable,
      mockMenu,
      mockSettings
    );

    expect(result.success).toBe(true);
    expect(result.order).toBeDefined();
    expect(result.order!.status).toBe("queued");
    expect(result.order!.table.id).toBe("1");
    expect(result.order!.items).toHaveLength(1);
    expect(result.order!.items[0].quantity).toBe(2);
  });

  it("createOrder rejects when exceeding max items per order", async () => {
    const result = await api.createOrder(
      [{ sushiId: "1", quantity: mockSettings.maxItemsPerOrder + 1 }],
      mockTable,
      mockMenu,
      mockSettings
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain("Maximum");
  });

  it("createOrder rejects when table has max active orders", async () => {
    // Place orders up to the limit
    for (let i = 0; i < mockSettings.maxActiveOrdersPerTable; i++) {
      await api.createOrder(
        [{ sushiId: "1", quantity: 1 }],
        mockTable,
        mockMenu,
        mockSettings
      );
    }

    // This one should fail
    const result = await api.createOrder(
      [{ sushiId: "1", quantity: 1 }],
      mockTable,
      mockMenu,
      mockSettings
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain("Maximum");
  });

  it("createOrder rejects orders with no valid items", async () => {
    const result = await api.createOrder(
      [{ sushiId: "nonexistent", quantity: 1 }],
      mockTable,
      mockMenu,
      mockSettings
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain("No valid items");
  });

  it("updateOrderStatus changes the order status", async () => {
    const createResult = await api.createOrder(
      [{ sushiId: "1", quantity: 1 }],
      mockTable,
      mockMenu,
      mockSettings
    );

    const updated = await api.updateOrderStatus(
      createResult.order!.id,
      "preparing"
    );

    expect(updated).not.toBeNull();
    expect(updated!.status).toBe("preparing");
  });

  it("updateOrderStatus returns null for non-existent order", async () => {
    const result = await api.updateOrderStatus("nonexistent", "preparing");
    expect(result).toBeNull();
  });

  it("orders persist dates correctly through serialisation", async () => {
    await api.createOrder(
      [{ sushiId: "1", quantity: 1 }],
      mockTable,
      mockMenu,
      mockSettings
    );

    const orders = await api.fetchOrders();
    expect(orders[0].createdAt).toBeInstanceOf(Date);
  });

  it("cancelOrder changes status to cancelled", async () => {
    const createResult = await api.createOrder(
      [{ sushiId: "1", quantity: 2 }],
      mockTable,
      mockMenu,
      mockSettings
    );

    const cancelled = await api.cancelOrder(createResult.order!.id);
    expect(cancelled).not.toBeNull();
    expect(cancelled!.status).toBe("cancelled");
  });

  it("cancelOrder returns null for non-existent order", async () => {
    const result = await api.cancelOrder("nonexistent-id");
    expect(result).toBeNull();
  });

  it("deleteOrder removes order from list", async () => {
    const createResult = await api.createOrder(
      [{ sushiId: "1", quantity: 1 }],
      mockTable,
      mockMenu,
      mockSettings
    );

    // First set to delivered (managers typically only delete completed orders)
    await api.updateOrderStatus(createResult.order!.id, "delivered");

    const success = await api.deleteOrder(createResult.order!.id);
    expect(success).toBe(true);

    const orders = await api.fetchOrders();
    expect(orders.find(o => o.id === createResult.order!.id)).toBeUndefined();
  });

  it("deleteOrder returns false for non-existent order", async () => {
    const result = await api.deleteOrder("nonexistent-id");
    expect(result).toBe(false);
  });

  it("deleteOrder can remove cancelled orders", async () => {
    const createResult = await api.createOrder(
      [{ sushiId: "1", quantity: 1 }],
      mockTable,
      mockMenu,
      mockSettings
    );

    // Cancel the order first
    await api.cancelOrder(createResult.order!.id);

    // Then delete it
    const success = await api.deleteOrder(createResult.order!.id);
    expect(success).toBe(true);

    const orders = await api.fetchOrders();
    expect(orders.find(o => o.id === createResult.order!.id)).toBeUndefined();
  });
});

// ==========================================================================
// SETTINGS API TESTS
// ==========================================================================
describe("Settings API", () => {
  it("fetchSettings returns defaults initially", async () => {
    const settings = await api.fetchSettings();
    expect(settings.maxItemsPerOrder).toBe(DEFAULT_SETTINGS.maxItemsPerOrder);
    expect(settings.maxActiveOrdersPerTable).toBe(
      DEFAULT_SETTINGS.maxActiveOrdersPerTable
    );
  });

  it("updateSettings merges with existing settings", async () => {
    const updated = await api.updateSettings({ maxItemsPerOrder: 20 });
    expect(updated.maxItemsPerOrder).toBe(20);
    expect(updated.maxActiveOrdersPerTable).toBe(
      DEFAULT_SETTINGS.maxActiveOrdersPerTable
    );
  });

  it("updateSettings persists changes", async () => {
    await api.updateSettings({ maxItemsPerOrder: 50 });
    const settings = await api.fetchSettings();
    expect(settings.maxItemsPerOrder).toBe(50);
  });
});
