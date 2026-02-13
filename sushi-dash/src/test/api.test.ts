/**
 * ==========================================================================
 * API Layer Unit Tests
 * ==========================================================================
 *
 * Tests the REST API client (lib/api.ts) by mocking global.fetch.
 * Every exported function is tested with:
 *   ✅ Success case — 200 response, correct data transformation
 *   ❌ Failure case — non-ok response, throws expected error
 *
 * Groups: Menu, Categories, Tables, Orders, Settings
 *
 * Testing Framework: Jest
 * ==========================================================================
 */

import {
  fetchMenu,
  createMenuItem,
  updateMenuItem,
  toggleItemAvailability,
  deleteMenuItem,
  fetchCategories,
  createCategory,
  deleteCategory,
  fetchTablesWithPins,
  createTable,
  updateTable,
  deleteTable,
  setTablePin,
  randomizeTablePin,
  fetchOrders,
  createOrder,
  updateOrderStatus,
  cancelOrder,
  deleteOrder,
  fetchSettings,
  updateSettings,
} from "@/lib/api";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal Response-like object for fetch mocking */
function mockResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as unknown as Response;
}

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = jest.fn();
});

afterAll(() => {
  global.fetch = originalFetch;
});

// ==========================================================================
// MENU CRUD
// ==========================================================================
describe("Menu API", () => {
  // ── fetchMenu ───────────────────────────────────────────────
  describe("fetchMenu", () => {
    it("returns transformed menu items on success", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockResponse({
          items: [
            {
              id: 1,
              name: "Salmon Nigiri",
              emoji: "🍣",
              category_name: "Nigiri",
              category_id: 1,
              is_popular: true,
              is_available: true,
            },
            {
              id: 2,
              name: "Tuna Roll",
              emoji: "🍙",
              category_name: "Rolls",
              category_id: 2,
              is_popular: false,
              is_available: false,
            },
          ],
        })
      );

      const items = await fetchMenu();

      expect(items).toHaveLength(2);
      expect(items[0]).toEqual({
        id: "1",
        name: "Salmon Nigiri",
        emoji: "🍣",
        category: "Nigiri",
        categoryId: 1,
        isPopular: true,
        isAvailable: true,
      });
      expect(items[1].id).toBe("2");
      expect(items[1].isAvailable).toBe(false);
      expect(global.fetch).toHaveBeenCalledWith("/api/menu", { credentials: "include" });
    });

    it("throws on server error", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse({}, false, 500));
      await expect(fetchMenu()).rejects.toThrow("Failed to fetch menu");
    });
  });

  // ── createMenuItem ──────────────────────────────────────────
  describe("createMenuItem", () => {
    it("creates and returns a new menu item", async () => {
      // First call: fetchCategories (to resolve category name → id)
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(mockResponse([{ id: 3, name: "Sashimi", sort_order: 3 }]))
        // Second call: POST /api/menu
        .mockResolvedValueOnce(
          mockResponse({
            id: 10,
            name: "Salmon Sashimi",
            emoji: "🐟",
            is_popular: false,
            is_available: true,
          })
        );

      const item = await createMenuItem({
        name: "Salmon Sashimi",
        emoji: "🐟",
        category: "Sashimi",
      });

      expect(item.id).toBe("10");
      expect(item.name).toBe("Salmon Sashimi");
      expect(item.isAvailable).toBe(true);
    });

    it("skips category lookup when categoryId is provided", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockResponse({ id: 11, name: "Test", emoji: "🍱", is_popular: false, is_available: true })
      );

      await createMenuItem({
        name: "Test",
        emoji: "🍱",
        category: "Sides",
        categoryId: 5,
      });

      // Only one call (no fetchCategories)
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it("throws on server error", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(mockResponse([{ id: 1, name: "Nigiri", sort_order: 1 }]))
        .mockResolvedValueOnce(mockResponse({}, false, 400));

      await expect(
        createMenuItem({ name: "Bad", emoji: "❌", category: "Nigiri" })
      ).rejects.toThrow("Failed to create menu item");
    });
  });

  // ── updateMenuItem ──────────────────────────────────────────
  describe("updateMenuItem", () => {
    it("sends PUT with updates and returns success", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse({ success: true }));

      const result = await updateMenuItem("5", { name: "New Name" });

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith("/api/menu/5", expect.objectContaining({ method: "PUT" }));
    });

    it("throws on server error", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse({}, false, 403));
      await expect(updateMenuItem("5", { name: "X" })).rejects.toThrow("Failed to update menu item");
    });
  });

  // ── toggleItemAvailability ──────────────────────────────────
  describe("toggleItemAvailability", () => {
    it("sends PATCH to toggle availability", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse({ success: true }));

      const result = await toggleItemAvailability("7", false);

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/menu/7/availability",
        expect.objectContaining({ method: "PATCH" })
      );
    });

    it("throws on server error", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse({}, false, 500));
      await expect(toggleItemAvailability("7", true)).rejects.toThrow("Failed to toggle availability");
    });
  });

  // ── deleteMenuItem ──────────────────────────────────────────
  describe("deleteMenuItem", () => {
    it("deletes item and returns success", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse({ success: true }));

      const result = await deleteMenuItem("3");

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith("/api/menu/3", expect.objectContaining({ method: "DELETE" }));
    });

    it("throws on server error", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse({}, false, 404));
      await expect(deleteMenuItem("99")).rejects.toThrow("Failed to delete menu item");
    });
  });
});

// ==========================================================================
// CATEGORY CRUD
// ==========================================================================
describe("Category API", () => {
  describe("fetchCategories", () => {
    it("returns categories array on success", async () => {
      const cats = [
        { id: 1, name: "Nigiri", sort_order: 1 },
        { id: 2, name: "Rolls", sort_order: 2 },
      ];
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse(cats));

      const result = await fetchCategories();
      expect(result).toEqual(cats);
    });

    it("throws on server error", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse({}, false, 500));
      await expect(fetchCategories()).rejects.toThrow("Failed to fetch categories");
    });
  });

  describe("createCategory", () => {
    it("creates and returns a category", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockResponse({ id: 5, name: "Desserts", sort_order: 5 })
      );

      const cat = await createCategory("Desserts");
      expect(cat.name).toBe("Desserts");
    });

    it("throws with server error message when available", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: () => Promise.resolve({ error: "Category already exists" }),
      } as unknown as Response);

      await expect(createCategory("Nigiri")).rejects.toThrow("Category already exists");
    });

    it("throws generic message when no error body", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error("no json")),
      } as unknown as Response);

      await expect(createCategory("Oops")).rejects.toThrow("Failed to create category");
    });
  });

  describe("deleteCategory", () => {
    it("deletes and returns success", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse({ success: true }));

      const result = await deleteCategory(3);
      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith("/api/categories/3", expect.objectContaining({ method: "DELETE" }));
    });

    it("throws on server error", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse({}, false, 404));
      await expect(deleteCategory(99)).rejects.toThrow("Failed to delete category");
    });
  });
});

// ==========================================================================
// TABLE CRUD
// ==========================================================================
describe("Table API", () => {
  describe("fetchTablesWithPins", () => {
    it("returns tables with string IDs", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockResponse([
          { id: 1, label: "Table 1", pin: "1234", pin_version: 1 },
          { id: 2, label: "Table 2", pin: "5678", pin_version: 1 },
        ])
      );

      const tables = await fetchTablesWithPins();

      expect(tables).toHaveLength(2);
      expect(tables[0].id).toBe("1");
      expect(tables[0].label).toBe("Table 1");
      expect(tables[1].id).toBe("2");
    });

    it("throws on server error", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse({}, false, 401));
      await expect(fetchTablesWithPins()).rejects.toThrow("Failed to fetch tables");
    });
  });

  describe("createTable", () => {
    it("creates and returns table with string id", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockResponse({ id: 7, label: "Bar", pin: "9999", pin_version: 1 })
      );

      const table = await createTable("Bar");
      expect(table.id).toBe("7");
      expect(table.label).toBe("Bar");
    });

    it("throws on server error", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse({}, false, 400));
      await expect(createTable("Bad")).rejects.toThrow("Failed to create table");
    });
  });

  describe("updateTable", () => {
    it("updates label and returns success", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse({ success: true }));

      const result = await updateTable("3", "VIP Table");
      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/tables/3",
        expect.objectContaining({ method: "PUT" })
      );
    });

    it("throws on server error", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse({}, false, 404));
      await expect(updateTable("99", "X")).rejects.toThrow("Failed to update table");
    });
  });

  describe("deleteTable", () => {
    it("deletes table and returns success", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse({ success: true }));

      const result = await deleteTable("2");
      expect(result.success).toBe(true);
    });

    it("throws on server error", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse({}, false, 404));
      await expect(deleteTable("99")).rejects.toThrow("Failed to delete table");
    });
  });

  describe("setTablePin", () => {
    it("sets PIN and returns success + pin", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockResponse({ success: true, pin: "4321" })
      );

      const result = await setTablePin("1", "4321");
      expect(result.success).toBe(true);
      expect(result.pin).toBe("4321");
    });

    it("throws on server error", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse({}, false, 400));
      await expect(setTablePin("1", "bad")).rejects.toThrow("Failed to set PIN");
    });
  });

  describe("randomizeTablePin", () => {
    it("randomizes PIN and returns new pin + version", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockResponse({ success: true, pin: "7890", pin_version: 3 })
      );

      const result = await randomizeTablePin("1");
      expect(result.success).toBe(true);
      expect(result.pin).toBe("7890");
      expect(result.pin_version).toBe(3);
    });

    it("throws on server error", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse({}, false, 500));
      await expect(randomizeTablePin("1")).rejects.toThrow("Failed to randomize PIN");
    });
  });
});

// ==========================================================================
// ORDER CRUD
// ==========================================================================
describe("Order API", () => {
  describe("fetchOrders", () => {
    it("returns transformed orders on success", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockResponse([
          {
            id: 1,
            table_id: 2,
            table_label: "Table 2",
            status: "queued",
            createdAt: "2025-01-01T12:00:00Z",
            items: [
              { id: 10, name: "Salmon Nigiri", emoji: "🍣", quantity: 3 },
            ],
          },
        ])
      );

      const orders = await fetchOrders();

      expect(orders).toHaveLength(1);
      expect(orders[0].id).toBe("1");
      expect(orders[0].table.id).toBe("2");
      expect(orders[0].table.label).toBe("Table 2");
      expect(orders[0].status).toBe("queued");
      expect(orders[0].items[0].sushi.name).toBe("Salmon Nigiri");
      expect(orders[0].items[0].quantity).toBe(3);
      expect(orders[0].createdAt).toBeInstanceOf(Date);
    });

    it("handles orders with no items array", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockResponse([{ id: 1, table_id: 1, status: "queued", createdAt: "2025-01-01T00:00:00Z" }])
      );

      const orders = await fetchOrders();
      expect(orders[0].items).toEqual([]);
    });

    it("throws on server error", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse({}, false, 500));
      await expect(fetchOrders()).rejects.toThrow("Failed to fetch orders");
    });
  });

  describe("createOrder", () => {
    it("creates and returns a transformed order", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockResponse({
          id: 5,
          table_id: 3,
          table_label: "Table 3",
          status: "queued",
          createdAt: "2025-01-01T12:00:00Z",
          items: [{ id: 1, name: "Tuna Roll", emoji: "🍙", quantity: 2 }],
        })
      );

      const order = await createOrder({
        items: [{ sushiId: "1", quantity: 2 }],
        tableId: "3",
      });

      expect(order.id).toBe("5");
      expect(order.table.id).toBe("3");
      expect(order.items[0].quantity).toBe(2);
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/orders/table/3",
        expect.objectContaining({ method: "POST" })
      );
    });

    it("throws with server error message when available", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: "Order limit reached" }),
      } as unknown as Response);

      await expect(
        createOrder({ items: [{ sushiId: "1", quantity: 1 }], tableId: "1" })
      ).rejects.toThrow("Order limit reached");
    });

    it("throws generic message when no error body", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error("no json")),
      } as unknown as Response);

      await expect(
        createOrder({ items: [{ sushiId: "1", quantity: 1 }], tableId: "1" })
      ).rejects.toThrow("Failed to create order");
    });
  });

  describe("updateOrderStatus", () => {
    it("updates status and returns result", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockResponse({ success: true, id: 1, status: "preparing" })
      );

      const result = await updateOrderStatus("1", "preparing");
      expect(result.success).toBe(true);
      expect(result.status).toBe("preparing");
    });

    it("throws on server error", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse({}, false, 404));
      await expect(updateOrderStatus("99", "ready")).rejects.toThrow("Failed to update order");
    });
  });

  describe("cancelOrder", () => {
    it("cancels order and returns success", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse({ success: true }));

      const result = await cancelOrder("4");
      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/orders/4/cancel",
        expect.objectContaining({ method: "PATCH" })
      );
    });

    it("throws on server error", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse({}, false, 403));
      await expect(cancelOrder("4")).rejects.toThrow("Failed to cancel order");
    });
  });

  describe("deleteOrder", () => {
    it("deletes order and returns success", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse({ success: true }));

      const result = await deleteOrder("2");
      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/orders/2",
        expect.objectContaining({ method: "DELETE" })
      );
    });

    it("throws on server error", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse({}, false, 404));
      await expect(deleteOrder("99")).rejects.toThrow("Failed to delete order");
    });
  });
});

// ==========================================================================
// SETTINGS CRUD
// ==========================================================================
describe("Settings API", () => {
  describe("fetchSettings", () => {
    it("returns coerced numeric settings", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockResponse({ maxItemsPerOrder: "15", maxActiveOrdersPerTable: "3" })
      );

      const settings = await fetchSettings();

      expect(settings.maxItemsPerOrder).toBe(15);
      expect(settings.maxActiveOrdersPerTable).toBe(3);
      expect(typeof settings.maxItemsPerOrder).toBe("number");
    });

    it("applies defaults when values are missing", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse({}));

      const settings = await fetchSettings();

      expect(settings.maxItemsPerOrder).toBe(10);
      expect(settings.maxActiveOrdersPerTable).toBe(2);
    });

    it("throws on server error", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse({}, false, 500));
      await expect(fetchSettings()).rejects.toThrow("Failed to fetch settings");
    });
  });

  describe("updateSettings", () => {
    it("updates and returns new settings", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockResponse({ maxItemsPerOrder: 20, maxActiveOrdersPerTable: 5 })
      );

      const result = await updateSettings({ maxItemsPerOrder: 20 });
      expect(result.maxItemsPerOrder).toBe(20);
    });

    it("throws on server error", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse({}, false, 403));
      await expect(updateSettings({ maxItemsPerOrder: 99 })).rejects.toThrow("Failed to update settings");
    });
  });
});
