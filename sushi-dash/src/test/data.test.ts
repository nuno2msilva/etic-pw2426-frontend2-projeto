/** Data integrity tests — seed data structure, table config, settings, category coverage */

import { DEFAULT_MENU, DEFAULT_TABLES, DEFAULT_SETTINGS } from "@/data/seedData";

describe("Is the menu big enough to impress or just sad?", () => {
  it("has at least 100 items — we're not running a food truck", () => {
    expect(DEFAULT_MENU.length).toBeGreaterThanOrEqual(100);
  });

  it("every item has an id, name, emoji, and category (no naked sushi)", () => {
    for (const item of DEFAULT_MENU) {
      expect(item.id).toBeDefined();
      expect(item.name).toBeDefined();
      expect(item.emoji).toBeDefined();
      expect(item.category).toBeDefined();
      expect(typeof item.id).toBe("string");
      expect(typeof item.name).toBe("string");
    }
  });

  it("all items are numbered because chaos is not a menu", () => {
    for (const item of DEFAULT_MENU) {
      expect(item.name).toMatch(/^#\d+/);
    }
  });

  it("no duplicate IDs — every sushi piece is a unique snowflake", () => {
    const ids = DEFAULT_MENU.map((item) => item.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("some items are flagged as popular (the cool kids of the menu)", () => {
    const popular = DEFAULT_MENU.filter((item) => item.isPopular);
    expect(popular.length).toBeGreaterThan(0);
  });

  it("covers nigiri, rolls, sashimi, hot dishes, sides, noodles, drinks, and desserts", () => {
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

describe("Are the tables set up or is everyone eating on the floor?", () => {
  it("has exactly 6 tables — no more, no less", () => {
    expect(DEFAULT_TABLES).toHaveLength(6);
  });

  it("tables are numbered 1 through 6 in order", () => {
    const ids = DEFAULT_TABLES.map((t) => t.id);
    expect(ids).toEqual(["1", "2", "3", "4", "5", "6"]);
  });

  it("every table has a name — we're civilized here", () => {
    for (const table of DEFAULT_TABLES) {
      expect(table.label).toBeDefined();
      expect(table.label.length).toBeGreaterThan(0);
    }
  });
});

describe("Are the order limits reasonable or are we enabling chaos?", () => {
  it("maxItemsPerOrder is set and positive", () => {
    expect(DEFAULT_SETTINGS.maxItemsPerOrder).toBeGreaterThan(0);
  });

  it("maxActiveOrdersPerTable is set and positive", () => {
    expect(DEFAULT_SETTINGS.maxActiveOrdersPerTable).toBeGreaterThan(0);
  });

  it("maxItemsPerOrder won't let you order the entire ocean", () => {
    expect(DEFAULT_SETTINGS.maxItemsPerOrder).toBeLessThanOrEqual(50);
  });

  it("maxActiveOrdersPerTable won't let you flood the kitchen", () => {
    expect(DEFAULT_SETTINGS.maxActiveOrdersPerTable).toBeLessThanOrEqual(10);
  });
});
