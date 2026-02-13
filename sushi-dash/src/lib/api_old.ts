/**
 * ==========================================================================
 * API Layer — Mock REST API for Sushi Dash
 * ==========================================================================
 *
 * Simulates a backend REST API using localStorage as persistence.
 * All functions return Promises to mimic real async HTTP requests (fetch).
 * This layer provides full CRUD operations for:
 *   - Menu items (GET, POST, DELETE)
 *   - Tables (GET, POST, DELETE)
 *   - Orders (GET, POST, PATCH)
 *   - Settings (GET, PUT)
 *
 * In a production app, these would be replaced with real fetch() or axios
 * calls pointing to a backend (e.g., Express + Prisma).
 * ==========================================================================
 */

import type { SushiItem, Table, Order, OrderStatus } from "@/types/sushi";
import { DEFAULT_MENU, DEFAULT_TABLES, DEFAULT_SETTINGS } from "@/data/defaultMenu";
import type { OrderSettings } from "@/context/SushiContext";

// ---------------------------------------------------------------------------
// Storage keys — centralised to avoid typos across the codebase
// ---------------------------------------------------------------------------
const STORAGE_KEYS = {
  MENU: "sushi-dash-api-menu",
  TABLES: "sushi-dash-api-tables",
  ORDERS: "sushi-dash-api-orders",
  SETTINGS: "sushi-dash-settings",
} as const;

// ---------------------------------------------------------------------------
// Simulated network delay (ms) — makes the UI feel like a real API
// ---------------------------------------------------------------------------
const SIMULATED_DELAY = 150;

/**
 * Helper: sleep for `ms` milliseconds.
 * Used to simulate network latency so loading states are visible.
 */
function delay(ms: number = SIMULATED_DELAY): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Auto-increment ID counter — persisted so IDs never collide
// ---------------------------------------------------------------------------
let nextId = 1000;

function generateId(): string {
  return String(nextId++);
}

// ==========================================================================
// MENU CRUD
// ==========================================================================

/**
 * GET /api/menu — Fetch all menu items.
 */
export async function fetchMenu(): Promise<SushiItem[]> {
  const res = await fetch("/api/menu", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch menu");
  return res.json();
}

/**
 * POST /api/menu — Add a new menu item.
 */
export async function createMenuItem(
  item: Omit<SushiItem, "id">
): Promise<SushiItem> {
  const res = await fetch("/api/menu", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error("Failed to create menu item");
  return res.json();
}
  await delay();
  const menu = await fetchMenu();
  const newId = generateId();
  const menuNumber = menu.length + 1;
  const nameWithNumber = item.name.startsWith("#")
    ? item.name
    : `#${menuNumber} ${item.name}`;

  const newItem: SushiItem = { ...item, id: newId, name: nameWithNumber };
  const updated = [...menu, newItem];
  localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(updated));
  return newItem;
}

/**
 * DELETE /api/menu/:id — Remove a menu item by ID.
 * Returns true if found and removed, false otherwise.
 */
export async function deleteMenuItem(id: string): Promise<boolean> {
  await delay();
  const menu = await fetchMenu();
  const filtered = menu.filter((item) => item.id !== id);
  if (filtered.length === menu.length) return false;
  localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(filtered));
  return true;
}

// ==========================================================================
// TABLE CRUD
// ==========================================================================

/**
 * GET /api/tables — Fetch all configured tables.
 */
export async function fetchTables(): Promise<Table[]> {
  await delay();
  const stored = localStorage.getItem(STORAGE_KEYS.TABLES);
  if (stored) {
    return JSON.parse(stored) as Table[];
  }
  localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(DEFAULT_TABLES));
  return [...DEFAULT_TABLES];
}

/**
 * POST /api/tables — Create a new table.
 */
export async function createTable(label: string): Promise<Table> {
  await delay();
  const tables = await fetchTables();
  const newTable: Table = { id: generateId(), label };
  const updated = [...tables, newTable];
  localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(updated));
  return newTable;
}

/**
 * DELETE /api/tables/:id — Remove a table by ID.
 */
export async function deleteTable(id: string): Promise<boolean> {
  await delay();
  const tables = await fetchTables();
  const filtered = tables.filter((t) => t.id !== id);
  if (filtered.length === tables.length) return false;
  localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(filtered));
  return true;
}

// ---------------------------------------------------------------------------
// PIN management (calls real backend)
// ---------------------------------------------------------------------------

/** Fetch tables with PINs from the backend (manager-only, plaintext PINs) */
export async function fetchTablesWithPins(): Promise<Table[]> {
  const res = await fetch("/api/tables", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch tables");
  return res.json();
}

/** Set a table PIN manually */
export async function setTablePin(
  id: string,
  pin: string
): Promise<{ success: boolean; pin: string }> {
  const res = await fetch(`/api/tables/${id}/pin`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ pin }),
  });
  if (!res.ok) throw new Error("Failed to set PIN");
  return res.json();
}

/** Randomize a table PIN (invalidates existing sessions) */
export async function randomizeTablePin(
  id: string
): Promise<{ success: boolean; pin: string; pin_version: number }> {
  const res = await fetch(`/api/tables/${id}/pin/randomize`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to randomize PIN");
  return res.json();
}

/** Update table label */
export async function updateTable(
  id: string,
  label: string
): Promise<{ success: boolean }> {
  const res = await fetch(`/api/tables/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ label }),
  });
  if (!res.ok) throw new Error("Failed to update table");
  return res.json();
}

/** Add new table */
export async function createTable(
  label: string
): Promise<Table> {
  const res = await fetch("/api/tables", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", 
    body: JSON.stringify({ label }),
  });
  if (!res.ok) throw new Error("Failed to create table");
  return res.json();
}

/** Delete table */
export async function deleteTable(
  id: string
): Promise<{ success: boolean }> {
  const res = await fetch(`/api/tables/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to delete table");
  return res.json();
}

// ==========================================================================
// ORDER CRUD
// ==========================================================================

/**
 * Serialise order dates to ISO strings for storage.
 */
function serialiseOrders(orders: Order[]): string {
  return JSON.stringify(
    orders.map((o) => ({ ...o, createdAt: o.createdAt.toISOString() }))
  );
}

/**
 * Deserialise stored order dates back to Date objects.
 */
function deserialiseOrders(raw: string): Order[] {
  const parsed = JSON.parse(raw) as Array<Order & { createdAt: string }>;
  return parsed.map((o) => ({ ...o, createdAt: new Date(o.createdAt) }));
}

/**
 * GET /api/orders — Fetch all orders.
 */
export async function fetchOrders(): Promise<Order[]> {
  await delay();
  const stored = localStorage.getItem(STORAGE_KEYS.ORDERS);
  if (stored) {
    return deserialiseOrders(stored);
  }
  return [];
}

/**
 * POST /api/orders — Place a new order.
 * Validates item count and table order limits.
 */
export async function createOrder(
  items: { sushiId: string; quantity: number }[],
  table: Table,
  menu: SushiItem[],
  settings: OrderSettings
): Promise<{ success: boolean; order?: Order; error?: string }> {
  await delay();

  const orders = await fetchOrders();

  // Validate: check active orders for the table
  const activeOrders = orders.filter(
    (o) => o.table.id === table.id && o.status !== "delivered"
  );
  if (activeOrders.length >= settings.maxActiveOrdersPerTable) {
    return {
      success: false,
      error: `Maximum ${settings.maxActiveOrdersPerTable} active orders per table. Please wait for current orders to be delivered.`,
    };
  }

  // Validate: item count
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  if (totalItems > settings.maxItemsPerOrder) {
    return {
      success: false,
      error: `Maximum ${settings.maxItemsPerOrder} items per order. You have ${totalItems} items.`,
    };
  }

  // Build order items from menu
  const orderItems = items
    .map(({ sushiId, quantity }) => {
      const sushi = menu.find((m) => m.id === sushiId);
      return sushi ? { sushi, quantity } : null;
    })
    .filter(Boolean) as { sushi: SushiItem; quantity: number }[];

  if (orderItems.length === 0) {
    return { success: false, error: "No valid items in order" };
  }

  const order: Order = {
    id: generateId(),
    items: orderItems,
    status: "queued",
    table,
    createdAt: new Date(),
  };

  const updated = [order, ...orders];
  localStorage.setItem(STORAGE_KEYS.ORDERS, serialiseOrders(updated));
  return { success: true, order };
}

/**
 * PATCH /api/orders/:id — Update an order's status.
 */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<Order | null> {
  await delay();
  const orders = await fetchOrders();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx === -1) return null;

  orders[idx] = { ...orders[idx], status };
  localStorage.setItem(STORAGE_KEYS.ORDERS, serialiseOrders(orders));
  return orders[idx];
}

/**
 * PATCH /api/orders/:id/cancel — Cancel an active (non-delivered) order.
 * Only managers should call this. Returns null if order not found or already
 * delivered.
 */
export async function cancelOrder(orderId: string): Promise<Order | null> {
  await delay();
  const orders = await fetchOrders();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx === -1) return null;

  // Cannot cancel a delivered order — use deleteOrder instead
  if (orders[idx].status === "delivered") return null;

  orders[idx] = { ...orders[idx], status: "cancelled" as OrderStatus };
  localStorage.setItem(STORAGE_KEYS.ORDERS, serialiseOrders(orders));
  return orders[idx];
}

/**
 * DELETE /api/orders/:id — Permanently remove a delivered/cancelled order.
 * Only managers should call this. Returns false if order not found or still
 * active (queued/preparing/ready).
 */
export async function deleteOrder(orderId: string): Promise<boolean> {
  await delay();
  const orders = await fetchOrders();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx === -1) return false;

  // Only allow deleting delivered or cancelled orders
  const status = orders[idx].status;
  if (status !== "delivered" && status !== "cancelled") return false;

  const filtered = orders.filter((o) => o.id !== orderId);
  localStorage.setItem(STORAGE_KEYS.ORDERS, serialiseOrders(filtered));
  return true;
}

// ==========================================================================
// SETTINGS CRUD
// ==========================================================================

/**
 * GET /api/settings — Fetch current order settings.
 */
export async function fetchSettings(): Promise<OrderSettings> {
  await delay();
  const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  if (stored) {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  }
  return { ...DEFAULT_SETTINGS };
}

/**
 * PUT /api/settings — Update order settings.
 */
export async function updateSettings(
  newSettings: Partial<OrderSettings>
): Promise<OrderSettings> {
  await delay();
  const current = await fetchSettings();
  const updated = { ...current, ...newSettings };
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
  return updated;
}
