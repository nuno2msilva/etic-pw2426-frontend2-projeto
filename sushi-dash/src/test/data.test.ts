/**
 * ==========================================================================
 * Sushi Types & Data Unit Tests
 * ==========================================================================
 *
 * Tests the default data configuration (data/defaultMenu.ts):
 *   - Menu structure and item format
 *   - Table configuration (6 tables default)
 *   - Settings defaults
 *   - Category coverage
 *   - Popular items flagging
 *
 * Testing Framework: Jest
 * ==========================================================================
 */

import { DEFAULT_MENU, DEFAULT_TABLES, DEFAULT_SETTINGS } from "@/data/defaultMenu";

// ==========================================================================
// DEFAULT MENU
// ==========================================================================
describe("Default Menu", () => {
  it("has at least 100 menu items", () => {
    expect(DEFAULT_MENU.length).toBeGreaterThanOrEqual(100);
  });

  it("every item has required fields", () => {
    for (const item of DEFAULT_MENU) {
      expect(item.id).toBeDefined();
      expect(item.name).toBeDefined();
      expect(item.emoji).toBeDefined();
      expect(item.category).toBeDefined();
      expect(typeof item.id).toBe("string");
      expect(typeof item.name).toBe("string");
    }
  });

  it("every item name starts with a number prefix", () => {
    for (const item of DEFAULT_MENU) {
      expect(item.name).toMatch(/^#\d+/);
    }
  });

  it("has unique IDs for all items", () => {
    const ids = DEFAULT_MENU.map((item) => item.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("includes popular items flagged with isPopular", () => {
    const popular = DEFAULT_MENU.filter((item) => item.isPopular);
    expect(popular.length).toBeGreaterThan(0);
  });

  it("covers all expected categories", () => {
    const categories = new Set(DEFAULT_MENU.map((item) => item.category));
    expect(categories.has("Nigiri")).toBe(true);
    expect(categories.has("Rolls")).toBe(true);
    expect(categories.has("Sashimi")).toBe(true);
    expect(categories.has("Hot Dishes")).toBe(true);
    expect(categories.has("Sides")).toBe(true);
    expect(categories.has("Noodles")).toBe(true);
    expect(categories.has("Drinks")).toBe(true);
    expect(categories.has("Desserts")).toBe(true);
  });
});

// ==========================================================================
// DEFAULT TABLES
// ==========================================================================
describe("Default Tables", () => {
  it("has exactly 6 tables", () => {
    expect(DEFAULT_TABLES).toHaveLength(6);
  });

  it("tables have sequential IDs from 1 to 6", () => {
    const ids = DEFAULT_TABLES.map((t) => t.id);
    expect(ids).toEqual(["1", "2", "3", "4", "5", "6"]);
  });

  it("every table has a label", () => {
    for (const table of DEFAULT_TABLES) {
      expect(table.label).toBeDefined();
      expect(table.label.length).toBeGreaterThan(0);
    }
  });
});

// ==========================================================================
// DEFAULT SETTINGS
// ==========================================================================
describe("Default Settings", () => {
  it("has maxItemsPerOrder set", () => {
    expect(DEFAULT_SETTINGS.maxItemsPerOrder).toBeGreaterThan(0);
  });

  it("has maxActiveOrdersPerTable set", () => {
    expect(DEFAULT_SETTINGS.maxActiveOrdersPerTable).toBeGreaterThan(0);
  });

  it("maxItemsPerOrder is reasonable (≤ 50)", () => {
    expect(DEFAULT_SETTINGS.maxItemsPerOrder).toBeLessThanOrEqual(50);
  });

  it("maxActiveOrdersPerTable is reasonable (≤ 10)", () => {
    expect(DEFAULT_SETTINGS.maxActiveOrdersPerTable).toBeLessThanOrEqual(10);
  });
});
