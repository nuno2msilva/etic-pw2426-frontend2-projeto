/**
 * db/seed.ts — Populate the database with default data
 *
 * Run with: npm run db:seed
 *
 * Imports data directly from the frontend's defaultMenu.ts and
 * seeds all tables. Passwords are hashed with SHA-256.
 */

import { createHash } from "crypto";
import { query } from "./connection.js";

// Import default data from the frontend source
import { DEFAULT_MENU, DEFAULT_TABLES, DEFAULT_SETTINGS } from "../../../src/data/defaultMenu.js";

/** SHA-256 hash matching the frontend's hashPassword() */
function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

/** Generate a random 4-digit PIN */
function generatePin(): string {
  return String(Math.floor(Math.random() * 10000)).padStart(4, "0");
}

// Category order for sorting
const CATEGORY_ORDER: Record<string, number> = {
  Nigiri: 1,
  Rolls: 2,
  "Specialty Rolls": 3,
  Sashimi: 4,
  "Hot Dishes": 5,
  Sides: 6,
  Noodles: 7,
  Drinks: 8,
  Desserts: 9,
  Specials: 10,
};

// Default table PINs (4 digits)
const TABLE_PINS: Record<string, string> = {
  "1": "1234",
  "2": "5678",
  "3": "9012",
  "4": "3456",
  "5": "7890",
  "6": "2468",
};

// Role passwords
const ROLE_PASSWORDS = [
  { role: "kitchen", password: "kitchen-master" },
  { role: "manager", password: "manager-admin" },
];

async function seed() {
  try {
    // ── Categories (derived from menu items) ────────────────
    const categoryNames = [...new Set(DEFAULT_MENU.map((i) => i.category))];
    console.log(`Seeding ${categoryNames.length} categories...`);
    for (const name of categoryNames) {
      const sortOrder = CATEGORY_ORDER[name] ?? 99;
      await query(
        "INSERT INTO categories (name, sort_order) VALUES (?, ?) ON CONFLICT (name) DO UPDATE SET sort_order = EXCLUDED.sort_order",
        [name, sortOrder]
      );
    }

    // Build a category name → id lookup
    const catRows = await query("SELECT id, name FROM categories") as { id: number; name: string }[];
    const catMap = new Map(catRows.map((r) => [r.name, r.id]));

    // ── Items ───────────────────────────────────────────────
    console.log(`Seeding ${DEFAULT_MENU.length} menu items...`);
    for (const item of DEFAULT_MENU) {
      const categoryId = catMap.get(item.category)!;
      await query(
        "INSERT INTO items (id, name, emoji, category_id, is_popular, is_available) VALUES (?, ?, ?, ?, ?, TRUE) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, emoji = EXCLUDED.emoji, category_id = EXCLUDED.category_id, is_popular = EXCLUDED.is_popular",
        [Number(item.id), item.name, item.emoji, categoryId, item.isPopular ?? false]
      );
    }

    // Reset sequence to continue after the highest seeded id
    const maxId = Math.max(...DEFAULT_MENU.map((i) => Number(i.id)));
    await query(`SELECT setval('items_id_seq', ${maxId})`);

    // ── Tables ──────────────────────────────────────────────
    console.log(`Seeding ${DEFAULT_TABLES.length} tables...`);
    for (const t of DEFAULT_TABLES) {
      const pin = TABLE_PINS[t.id] ?? generatePin();
      await query(
        "INSERT INTO tables_config (id, label, pin, pin_version) VALUES (?, ?, ?, 1) ON CONFLICT (id) DO UPDATE SET label = EXCLUDED.label, pin = EXCLUDED.pin",
        [Number(t.id), t.label, pin]
      );
    }

    // Reset sequence for tables
    const maxTableId = Math.max(...DEFAULT_TABLES.map((t) => Number(t.id)));
    await query(`SELECT setval('tables_config_id_seq', ${maxTableId})`);

    // ── Role passwords ──────────────────────────────────────
    console.log(`Seeding ${ROLE_PASSWORDS.length} role passwords...`);
    for (const p of ROLE_PASSWORDS) {
      const hash = hashPassword(p.password);
      await query(
        "INSERT INTO passwords (role, password_hash) VALUES (?, ?) ON CONFLICT (role) DO UPDATE SET password_hash = EXCLUDED.password_hash",
        [p.role, hash]
      );
    }

    // ── Settings ────────────────────────────────────────────
    console.log("Seeding settings...");
    await query(
      "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
      ["maxItemsPerOrder", DEFAULT_SETTINGS.maxItemsPerOrder]
    );
    await query(
      "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
      ["maxActiveOrdersPerTable", DEFAULT_SETTINGS.maxActiveOrdersPerTable]
    );

    console.log("Seed complete!");
  } catch (err) {
    console.error("Seed failed:", err);
    throw err;
  }
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
