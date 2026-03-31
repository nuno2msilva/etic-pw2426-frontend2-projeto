// Can the API survive a round trip without losing the sushi?

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
} from "@/features/shared/lib/api";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Builds a minimal Response-like object so we can pretend fetch works
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

describe("Can we manage the menu without breaking the kitchen?", () => {
  describe("fetchMenu — does the backend even speak sushi?", () => {
    it("transforms raw backend data into civilized frontend objects", async () => {
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

    it("throws a fit when the server is having a bad day", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse({}, false, 500));
      await expect(fetchMenu()).rejects.toThrow("Failed to fetch menu");
    });
  });

  describe("createMenuItem — adding sushi to the lineup", () => {
    it("resolves category by name and returns the shiny new item", async () => {
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

    it("skips the category detour when categoryId is already known", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockResponse({ id: 11, name: "Test", emoji: "🍱", is_popular: false, is_available: true })
      );

      await createMenuItem({
        name: "Test",
        emoji: "🍱",
        category: "Sides",
        categoryId: 5,
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it("refuses to create garbage items on a 400", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(mockResponse([{ id: 1, name: "Nigiri", sort_order: 1 }]))
        .mockResolvedValueOnce(mockResponse({}, false, 400));

      await expect(
        createMenuItem({ name: "Bad", emoji: "❌", category: "Nigiri" })
      ).rejects.toThrow("Failed to create menu item");
    });
  });

  describe("updateMenuItem — renaming sushi mid-service", () => {
    it("sends the rename to the server and gets a thumbs up", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse({ success: true }));

      const result = await updateMenuItem("5", { name: "New Name" });

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith("/api/menu/5", expect.objectContaining({ method: "PUT" }));
    });

    it("throws when the server says you can't rename that", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse({}, false, 403));
      await expect(updateMenuItem("5", { name: "X" })).rejects.toThrow("Failed to update menu item");
    });
  });

  describe("toggleItemAvailability — the 86'd list", () => {
    it("patches availability without drama", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse({ success: true }));

      const result = await toggleItemAvailability("7", false);

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/menu/7/availability",
        expect.objectContaining({ method: "PATCH" })
      );
    });

    it("explodes gracefully on server meltdown", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse({}, false, 500));
      await expect(toggleItemAvailability("7", true)).rejects.toThrow("Failed to toggle availability");
    });
  });

  describe("deleteMenuItem — goodbye forever, old sushi", () => {
    it("removes the item and confirms the deed", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse({ success: true }));

      const result = await deleteMenuItem("3");

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith("/api/menu/3", expect.objectContaining({ method: "DELETE" }));
    });

    it("throws when trying to delete a ghost item", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse({}, false, 404));
      await expect(deleteMenuItem("99")).rejects.toThrow("Failed to delete menu item");
    });
  });
});

describe("Can we organize categories without losing our mind?", () => {
  describe("fetchCategories — loading the filing cabinet", () => {
    it("returns the full category list looking respectable", async () => {
      const cats = [
        { id: 1, name: "Nigiri", sort_order: 1 },
        { id: 2, name: "Rolls", sort_order: 2 },
      ];
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse(cats));

      const result = await fetchCategories();
      expect(result).toEqual(cats);
    });

    it("throws when the server forgets what categories are", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse({}, false, 500));
      await expect(fetchCategories()).rejects.toThrow("Failed to fetch categories");
    });
  });

  describe("createCategory — inventing new sushi genres", () => {
    it("brings a new category into existence", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockResponse({ id: 5, name: "Desserts", sort_order: 5 })
      );

      const cat = await createCategory("Desserts");
      expect(cat.name).toBe("Desserts");
    });

    it("tells you off when the category already exists", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: () => Promise.resolve({ error: "Category already exists" }),
      } as unknown as Response);

      await expect(createCategory("Nigiri")).rejects.toThrow("Category already exists");
    });

    it("falls back to a generic error when the server is speechless", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error("no json")),
      } as unknown as Response);

      await expect(createCategory("Oops")).rejects.toThrow("Failed to create category");
    });
  });

  describe("deleteCategory — scorched earth policy", () => {
    it("nukes the category and everything in it", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse({ success: true }));

      const result = await deleteCategory(3);
      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith("/api/categories/3", expect.objectContaining({ method: "DELETE" }));
    });

    it("throws when trying to delete a nonexistent category", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse({}, false, 404));
      await expect(deleteCategory(99)).rejects.toThrow("Failed to delete category");
    });
  });
});

describe("Can we juggle tables without flipping any?", () => {
  describe("fetchTablesWithPins — revealing the secret PINs", () => {
    it("converts numeric IDs to strings because TypeScript said so", async () => {
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

    it("throws when excluded from the table list", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse({}, false, 401));
      await expect(fetchTablesWithPins()).rejects.toThrow("Failed to fetch tables");
    });
  });

  describe("createTable — manifesting furniture from thin air", () => {
    it("creates a table with a stringified ID", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockResponse({ id: 7, label: "Bar", pin: "9999", pin_version: 1 })
      );

      const table = await createTable("Bar");
      expect(table.id).toBe("7");
      expect(table.label).toBe("Bar");
    });

    it("throws when the restaurant is full of tables", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse({}, false, 400));
      await expect(createTable("Bad")).rejects.toThrow("Failed to create table");
    });
  });

  describe("updateTable — table identity crisis", () => {
    it("renames a table without existential panic", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse({ success: true }));

      const result = await updateTable("3", "VIP Table");
      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/tables/3",
        expect.objectContaining({ method: "PUT" })
      );
    });

    it("throws when the table doesn't exist to rename", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse({}, false, 404));
      await expect(updateTable("99", "X")).rejects.toThrow("Failed to update table");
    });
  });

  describe("deleteTable — making tables vanish", () => {
    it("removes the table from existence", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse({ success: true }));

      const result = await deleteTable("2");
      expect(result.success).toBe(true);
    });

    it("throws when there's nothing to delete", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse({}, false, 404));
      await expect(deleteTable("99")).rejects.toThrow("Failed to delete table");
    });
  });

  describe("setTablePin — changing the secret handshake", () => {
    it("sets the PIN and confirms it stuck", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockResponse({ success: true, pin: "4321" })
      );

      const result = await setTablePin("1", "4321");
      expect(result.success).toBe(true);
      expect(result.pin).toBe("4321");
    });

    it("throws when the PIN is rejected", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse({}, false, 400));
      await expect(setTablePin("1", "bad")).rejects.toThrow("Failed to set PIN");
    });
  });

  describe("randomizeTablePin — chaos mode for PINs", () => {
    it("generates a fresh random PIN and bumps the version", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockResponse({ success: true, pin: "7890", pin_version: 3 })
      );

      const result = await randomizeTablePin("1");
      expect(result.success).toBe(true);
      expect(result.pin).toBe("7890");
      expect(result.pin_version).toBe(3);
    });

    it("throws when randomization goes sideways", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse({}, false, 500));
      await expect(randomizeTablePin("1")).rejects.toThrow("Failed to randomize PIN");
    });
  });
});

describe("Can we handle orders without losing anyone's dinner?", () => {
  describe("fetchOrders — loading the queue without amnesia", () => {
    it("parses raw order data into proper Order objects with Dates", async () => {
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
      expect(orders[0].items[0].item.name).toBe("Salmon Nigiri");
      expect(orders[0].items[0].quantity).toBe(3);
      expect(orders[0].createdAt).toBeInstanceOf(Date);
    });

    it("gracefully handles orders that somehow have no items", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockResponse([{ id: 1, table_id: 1, status: "queued", createdAt: "2025-01-01T00:00:00Z" }])
      );

      const orders = await fetchOrders();
      expect(orders[0].items).toEqual([]);
    });

    it("throws when the kitchen lost the order list", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse({}, false, 500));
      await expect(fetchOrders()).rejects.toThrow("Failed to fetch orders");
    });
  });

  describe("createOrder — sending sushi wishes to the kitchen", () => {
    it("places the order and gets back a properly shaped confirmation", async () => {
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

    it("relays the server's specific complaint when order creation fails", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: "Order limit reached" }),
      } as unknown as Response);

      await expect(
        createOrder({ items: [{ sushiId: "1", quantity: 1 }], tableId: "1" })
      ).rejects.toThrow("Order limit reached");
    });

    it("falls back to generic error when server returns unparseable nonsense", async () => {
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

  describe("updateOrderStatus — pushing orders through the pipeline", () => {
    it("advances the status and gets confirmation", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockResponse({ success: true, id: 1, status: "preparing" })
      );

      const result = await updateOrderStatus("1", "preparing");
      expect(result.success).toBe(true);
      expect(result.status).toBe("preparing");
    });

    it("throws when trying to update a phantom order", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse({}, false, 404));
      await expect(updateOrderStatus("99", "ready")).rejects.toThrow("Failed to update order");
    });
  });

  describe("cancelOrder — the customer changed their mind", () => {
    it("cancels the order without remorse", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse({ success: true }));

      const result = await cancelOrder("4");
      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/orders/4/cancel",
        expect.objectContaining({ method: "PATCH" })
      );
    });

    it("throws when cancellation is denied", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse({}, false, 403));
      await expect(cancelOrder("4")).rejects.toThrow("Failed to cancel order");
    });
  });

  describe("deleteOrder — erasing the evidence", () => {
    it("permanently deletes the order record", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse({ success: true }));

      const result = await deleteOrder("2");
      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/orders/2",
        expect.objectContaining({ method: "DELETE" })
      );
    });

    it("throws when the order is already gone", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse({}, false, 404));
      await expect(deleteOrder("99")).rejects.toThrow("Failed to delete order");
    });
  });
});

describe("Can we tweak settings without the whole thing falling apart?", () => {
  describe("fetchSettings — reading the restaurant's rulebook", () => {
    it("coerces string values to numbers because the backend is quirky", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockResponse({ maxItemsPerOrder: "15", maxActiveOrdersPerTable: "3" })
      );

      const settings = await fetchSettings();

      expect(settings.maxItemsPerOrder).toBe(15);
      expect(settings.maxActiveOrdersPerTable).toBe(3);
      expect(typeof settings.maxItemsPerOrder).toBe("number");
    });

    it("fills in sensible defaults when the backend shrugs", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse({}));

      const settings = await fetchSettings();

      expect(settings.maxItemsPerOrder).toBe(10);
      expect(settings.maxActiveOrdersPerTable).toBe(2);
    });

    it("throws when the settings endpoint is on strike", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse({}, false, 500));
      await expect(fetchSettings()).rejects.toThrow("Failed to fetch settings");
    });
  });

  describe("updateSettings — rewriting the rules", () => {
    it("persists new settings and returns the updated values", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockResponse({ maxItemsPerOrder: 20, maxActiveOrdersPerTable: 5 })
      );

      const result = await updateSettings({ maxItemsPerOrder: 20 });
      expect(result.maxItemsPerOrder).toBe(20);
    });

    it("throws when the server won't let you change the rules", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse({}, false, 403));
      await expect(updateSettings({ maxItemsPerOrder: 99 })).rejects.toThrow("Failed to update settings");
    });
  });
});
