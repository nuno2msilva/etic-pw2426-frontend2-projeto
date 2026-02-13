/**
 * db/init.ts — Create the sushi_dash database and all tables
 *
 * Run with: npm run db:init
 *
 * This script:
 *   1. Creates the database if it doesn't exist
 *   2. Drops and recreates all tables (destructive!)
 *   3. Sets up foreign keys and indexes
 */

import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Client } = pkg;
const DB_NAME = process.env.DB_NAME ?? "sushi_dash";

async function init() {
  // Connect to PostgreSQL server (not to specific database)
  const client = new Client({
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USER ?? "postgres",
    password: process.env.DB_PASSWORD ?? "",
  });

  try {
    await client.connect();
    
    // Create database if it doesn't exist
    console.log(`Creating database "${DB_NAME}"...`);
    try {
      await client.query(`CREATE DATABASE "${DB_NAME}"`);
      console.log("Database created.");
    } catch (err: any) {
      if (err.code === '42P04') {
        console.log("Database already exists.");
      } else {
        throw err;
      }
    }
    
    await client.end();
    
    // Now connect to the specific database
    const dbClient = new Client({
      host: process.env.DB_HOST ?? "localhost",
      port: Number(process.env.DB_PORT ?? 5432), 
      user: process.env.DB_USER ?? "postgres",
      password: process.env.DB_PASSWORD ?? "",
      database: DB_NAME,
    });
    
    await dbClient.connect();

    console.log("Creating tables...");

    // Create order status enum type
    await dbClient.query(`
      DROP TYPE IF EXISTS order_status CASCADE;
      CREATE TYPE order_status AS ENUM ('queued','preparing','ready','delivered','cancelled');
    `);

    // ── Drop all tables ─────────────────────────────────────────
    await dbClient.query(`
      DROP TABLE IF EXISTS order_items CASCADE;
      DROP TABLE IF EXISTS orders CASCADE;
      DROP TABLE IF EXISTS items CASCADE;
      DROP TABLE IF EXISTS categories CASCADE;
      DROP TABLE IF EXISTS sessions CASCADE;
      DROP TABLE IF EXISTS tables_config CASCADE;
      DROP TABLE IF EXISTS passwords CASCADE;
      DROP TABLE IF EXISTS settings CASCADE;
    `);

    // ── Categories ────────────────────────────────────────────
    await dbClient.query(`
      CREATE TABLE categories (
        id          SERIAL        PRIMARY KEY,
        name        VARCHAR(100)  NOT NULL UNIQUE,
        sort_order  INTEGER       NOT NULL DEFAULT 0
      )
    `);

    // ── Items (menu) ──────────────────────────────────────────
    await dbClient.query(`
      CREATE TABLE items (
        id            SERIAL        PRIMARY KEY,
        name          VARCHAR(200)  NOT NULL,
        emoji         VARCHAR(20)   NOT NULL,
        category_id   INTEGER       NOT NULL,
        is_popular    BOOLEAN       NOT NULL DEFAULT FALSE,
        is_available  BOOLEAN       NOT NULL DEFAULT TRUE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
      )
    `);

    // ── Tables ────────────────────────────────────────────────
    await dbClient.query(`
      CREATE TABLE tables_config (
        id             SERIAL        PRIMARY KEY,
        label          VARCHAR(100)  NOT NULL UNIQUE,
        pin            VARCHAR(4)    NOT NULL,
        pin_version    INTEGER       NOT NULL DEFAULT 1
      )
    `);

    // ── Role passwords (kitchen, manager) ─────────────────────
    await dbClient.query(`
      CREATE TABLE passwords (
        role           VARCHAR(20)   PRIMARY KEY,
        password_hash  VARCHAR(64)   NOT NULL
      )
    `);

    // ── Sessions (JWT tracking for revocation) ────────────────
    await dbClient.query(`
      CREATE TABLE sessions (
        token      VARCHAR(512)  PRIMARY KEY,
        role       VARCHAR(20)   NOT NULL,
        table_id   INTEGER       NULL,
        created_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP     NOT NULL,
        FOREIGN KEY (table_id) REFERENCES tables_config(id) ON DELETE SET NULL
      )
    `);

    // ── Orders ────────────────────────────────────────────────
    await dbClient.query(`
      CREATE TABLE orders (
        id         SERIAL         PRIMARY KEY,
        table_id   INTEGER        NOT NULL,
        status     order_status   NOT NULL DEFAULT 'queued',
        created_at TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (table_id) REFERENCES tables_config(id) ON DELETE CASCADE
      )
    `);
    
    await dbClient.query(`
      CREATE INDEX idx_orders_table_status ON orders (table_id, status)
    `);

    // ── Order items (junction) ────────────────────────────────
    await dbClient.query(`
      CREATE TABLE order_items (
        id        SERIAL   PRIMARY KEY,
        order_id  INTEGER  NOT NULL,
        item_id   INTEGER  NOT NULL,
        quantity  INTEGER  NOT NULL DEFAULT 1,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (item_id)  REFERENCES items(id)  ON DELETE CASCADE
      )
    `);

    // ── Settings (key-value) ──────────────────────────────────
    await dbClient.query(`
      CREATE TABLE settings (
        key    VARCHAR(100)  PRIMARY KEY,
        value  INTEGER       NOT NULL
      )
    `);

    console.log("All tables created successfully.");
    await dbClient.end();
  } catch (err) {
    console.error("DB init failed:", err);
    process.exit(1);
  }
}

init();
