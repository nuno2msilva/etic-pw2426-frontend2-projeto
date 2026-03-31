/**
 * db/seed.ts — Populate the database with default data
 *
 * Run with: npm run db:seed
 *
 * Imports data directly from the frontend's seedData.ts and
 * seeds all tables. Passwords are hashed with bcrypt (async).
 */

import "dotenv/config";
import bcrypt from "bcryptjs";
import prisma from "./prisma";

// Import default data from the frontend source (dynamic import for cross-package-boundary compatibility)
const { DEFAULT_MENU, DEFAULT_TABLES, DEFAULT_SETTINGS } = await import("../../../src/data/seedData");

/** Generate a random 4-digit PIN */
function generatePin(): string {
  return String(Math.floor(Math.random() * 10000)).padStart(4, "0");
}

/** Hash a password with bcrypt (cost=10) */
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
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

// Default users with email & password (permissions = kitchen < manager < admin)
// These are created automatically when the database is seeded (npm run db:seed)
// Perfect for fresh deployments to kickstart the app and immediately start managing menus/tables
const DEFAULT_USERS = [
  { email: "admin@sushidash.dev", username: "admin", password: "Admin@12345", permission: "admin" as const, passwordResetRequired: false },
  { email: "manager@sushidash.dev", username: "manager", password: "Manager@12345", permission: "manager" as const, passwordResetRequired: false },
  { email: "kitchen@sushidash.dev", username: "kitchen", password: "Kitchen@12345", permission: "kitchen" as const, passwordResetRequired: false },
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
        update: { label: t.label, pin, isActive: true },
        create: { id: Number(t.id), label: t.label, pin, pinVersion: 1, isActive: true },
      });
    }

    // Reset sequence for tables
    const maxTableId = Math.max(...DEFAULT_TABLES.map((t) => Number(t.id)));
    await prisma.$executeRawUnsafe(`SELECT setval('tables_config_id_seq', ${maxTableId})`);

    // ── NEW USERS (replaces old Password model) ─────────────
    console.log(`Seeding ${DEFAULT_USERS.length} staff users...`);
    for (const u of DEFAULT_USERS) {
      const hash = await hashPassword(u.password);
      await prisma.user.upsert({
        where: { email: u.email },
        update: { username: u.username, passwordHash: hash, passwordPreview: u.password, permission: u.permission, isActive: true, passwordResetRequired: false, skipPasswordResetReminder: false },
        create: { email: u.email, username: u.username, passwordHash: hash, passwordPreview: u.password, permission: u.permission, isActive: true, passwordResetRequired: false, skipPasswordResetReminder: false },
      });
      console.log(`  ✓ ${u.email} (${u.permission})`);
    }

    // ── Settings ────────────────────────────────────────────
    console.log("Seeding settings...");
    await prisma.setting.upsert({
      where: { key: "maxItemsPerOrder" },
      update: { value: DEFAULT_SETTINGS.maxItemsPerOrder },
      create: { key: "maxItemsPerOrder", value: DEFAULT_SETTINGS.maxItemsPerOrder },
    });
    await prisma.setting.upsert({
      where: { key: "maxActiveOrdersPerTable" },
      update: { value: DEFAULT_SETTINGS.maxActiveOrdersPerTable },
      create: { key: "maxActiveOrdersPerTable", value: DEFAULT_SETTINGS.maxActiveOrdersPerTable },
    });

    // Log default credentials reminder
    console.log("\n📋 Default Staff Credentials:\n");
    DEFAULT_USERS.forEach((u) => {
      console.log(`   ${u.permission.toUpperCase()}: ${u.email}`);
      console.log(`   Password: ${u.password}\n`);
    });

    console.log("✅ Seed complete!");
  } catch (err) {
    console.error("❌ Seed failed:", err);
    throw err;
  } finally {
    await prisma.$disconnect();
  }
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
