/**
 * db/seed.ts — Populate the database with default data
 *
 * Run with: npm run db:seed
 *
 * Imports data directly from the frontend's defaultMenu.ts and
 * seeds all tables. Passwords are hashed with SHA-256.
 */

import "dotenv/config";
import { createHash } from "crypto";
import prisma from "./prisma.js";

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
      await prisma.category.upsert({
        where: { name },
        update: { sortOrder },
        create: { name, sortOrder },
      });
    }

    // Build a category name → id lookup
    const catRows = await prisma.category.findMany({ select: { id: true, name: true } });
    const catMap = new Map(catRows.map((r) => [r.name, r.id]));

    // ── Items ───────────────────────────────────────────────
    console.log(`Seeding ${DEFAULT_MENU.length} menu items...`);
    for (const item of DEFAULT_MENU) {
      const categoryId = catMap.get(item.category)!;
      await prisma.item.upsert({
        where: { id: Number(item.id) },
        update: { name: item.name, emoji: item.emoji, categoryId, isPopular: item.isPopular ?? false },
        create: { id: Number(item.id), name: item.name, emoji: item.emoji, categoryId, isPopular: item.isPopular ?? false, isAvailable: true },
      });
    }

    // Reset sequence to continue after the highest seeded id
    const maxId = Math.max(...DEFAULT_MENU.map((i) => Number(i.id)));
    await prisma.$executeRawUnsafe(`SELECT setval('items_id_seq', ${maxId})`);

    // ── Tables ──────────────────────────────────────────────
    console.log(`Seeding ${DEFAULT_TABLES.length} tables...`);
    for (const t of DEFAULT_TABLES) {
      const pin = TABLE_PINS[t.id] ?? generatePin();
      await prisma.tableConfig.upsert({
        where: { id: Number(t.id) },
        update: { label: t.label, pin },
        create: { id: Number(t.id), label: t.label, pin, pinVersion: 1 },
      });
    }

    // Reset sequence for tables
    const maxTableId = Math.max(...DEFAULT_TABLES.map((t) => Number(t.id)));
    await prisma.$executeRawUnsafe(`SELECT setval('tables_config_id_seq', ${maxTableId})`);

    // ── Role passwords ──────────────────────────────────────
    console.log(`Seeding ${ROLE_PASSWORDS.length} role passwords...`);
    for (const p of ROLE_PASSWORDS) {
      const hash = hashPassword(p.password);
      await prisma.password.upsert({
        where: { role: p.role },
        update: { passwordHash: hash },
        create: { role: p.role, passwordHash: hash },
      });
    }

    // ── Settings ────────────────────────────────────────────
    console.log("Seeding settings...");
    await prisma.setting.upsert({
      where: { key: "maxItemsPerOrder" },
      update: { value: String(DEFAULT_SETTINGS.maxItemsPerOrder) },
      create: { key: "maxItemsPerOrder", value: String(DEFAULT_SETTINGS.maxItemsPerOrder) },
    });
    await prisma.setting.upsert({
      where: { key: "maxActiveOrdersPerTable" },
      update: { value: String(DEFAULT_SETTINGS.maxActiveOrdersPerTable) },
      create: { key: "maxActiveOrdersPerTable", value: String(DEFAULT_SETTINGS.maxActiveOrdersPerTable) },
    });

    console.log("Seed complete!");
  } catch (err) {
    console.error("Seed failed:", err);
    throw err;
  } finally {
    await prisma.$disconnect();
  }
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
