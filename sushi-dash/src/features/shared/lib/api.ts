/** REST API client — all HTTP requests to the Express.js + PostgreSQL backend */

import type { MenuItem, Table, Order, OrderStatus, Category, OrderSettings } from "@/features/shared/types/models";
import { API_BASE } from "@/features/shared/lib/config";

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject | JsonArray;
type JsonObject = { [key: string]: JsonValue };
type JsonArray = JsonValue[];

async function requestJson<T>(
  input: RequestInfo | URL,
  init: RequestInit,
  fallbackError: string
): Promise<T> {
  const res = await fetch(input, init);
  if (!res.ok) {
    const errorPayload = await res.json().catch(() => ({} as { error?: string }));
    throw new Error(errorPayload.error || fallbackError);
  }
  return res.json() as Promise<T>;
}

function mapMenuItemFromBackend(item: Record<string, JsonValue>): MenuItem {
  return {
    id: String(item.id),
    name: String(item.name ?? ""),
    emoji: String(item.emoji ?? ""),
    category: String(item.category_name ?? ""),
    categoryId: Number(item.category_id),
    isPopular: Boolean(item.is_popular),
    isAvailable: Boolean(item.is_available),
  };
}

function mapTableFromBackend(table: Record<string, JsonValue>): Table {
  return {
    ...(table as unknown as Omit<Table, "id">),
    id: String(table.id),
  };
}

type BackendOrderItem = {
  id: number;
  name: string;
  emoji: string;
  quantity: number;
};

type BackendOrder = {
  id: number;
  table_id: number;
  table_label?: string;
  items?: BackendOrderItem[];
  status: string;
  createdAt: string;
};

// ==========================================================================
// MENU CRUD
// ==========================================================================

/** GET /api/menu — Fetch all menu items */
export async function fetchMenu(): Promise<MenuItem[]> {
  const data = await requestJson<{ items: Record<string, JsonValue>[] }>(
    `${API_BASE}/api/menu`,
    { credentials: "include" },
    "Failed to fetch menu"
  );
  
  // Transform backend response to frontend format
  return data.items.map(mapMenuItemFromBackend);
}

/** POST /api/menu — Add a new menu item */
export async function createMenuItem(
  item: Omit<MenuItem, "id"> & { categoryId?: number }
): Promise<MenuItem> {
  let categoryId = item.categoryId;
  
  // If no categoryId provided, look it up by name
  if (!categoryId) {
    const categories = await fetchCategories();
    const category = categories.find((c) => c.name === item.category);
    categoryId = category?.id;
  }
  
  const res = await fetch(`${API_BASE}/api/menu`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      name: item.name,
      emoji: item.emoji,
      category_id: categoryId,
      is_popular: item.isPopular ?? false,
    }),
  });
  if (!res.ok) throw new Error("Failed to create menu item");
  const data = await res.json();
  
  return {
    id: String(data.id),
    name: data.name,
    emoji: data.emoji,
    category: item.category,
    isPopular: data.is_popular,
    isAvailable: data.is_available ?? true,
  };
}

/** PUT /api/menu/:id — Update a menu item (name, emoji, etc.) */
export async function updateMenuItem(
  id: string,
  updates: { name?: string; emoji?: string; category_id?: number; is_popular?: boolean }
): Promise<{ success: boolean }> {
  return requestJson<{ success: boolean }>(
    `${API_BASE}/api/menu/${id}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(updates),
    },
    "Failed to update menu item"
  );
}

/** PATCH /api/menu/:id/availability — Toggle item availability */
export async function toggleItemAvailability(
  id: string,
  isAvailable: boolean
): Promise<{ success: boolean }> {
  return requestJson<{ success: boolean }>(
    `${API_BASE}/api/menu/${id}/availability`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ is_available: isAvailable }),
    },
    "Failed to toggle availability"
  );
}

/** DELETE /api/menu/:id — Remove a menu item by ID */
export async function deleteMenuItem(id: string): Promise<{ success: boolean }> {
  return requestJson<{ success: boolean }>(
    `${API_BASE}/api/menu/${id}`,
    {
      method: "DELETE",
      credentials: "include",
    },
    "Failed to delete menu item"
  );
}

// ==========================================================================
// CATEGORY CRUD
// ==========================================================================

/** GET /api/categories — Fetch all categories */
export async function fetchCategories(): Promise<Category[]> {
  return requestJson<Category[]>(
    `${API_BASE}/api/categories`,
    { credentials: "include" },
    "Failed to fetch categories"
  );
}

/** POST /api/categories — Create a new category */
export async function createCategory(name: string): Promise<Category> {
  return requestJson<Category>(
    `${API_BASE}/api/categories`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name }),
    },
    "Failed to create category"
  );
}

/** DELETE /api/categories/:id — Delete a category (cascades items) */
export async function deleteCategory(id: number): Promise<{ success: boolean }> {
  return requestJson<{ success: boolean }>(
    `${API_BASE}/api/categories/${id}`,
    {
      method: "DELETE",
      credentials: "include",
    },
    "Failed to delete category"
  );
}

// ==========================================================================
// TABLE CRUD
// ==========================================================================

/** GET /api/tables — Fetch tables with PINs (manager auth required) */
export async function fetchTablesWithPins(): Promise<Table[]> {
  const requestInit: RequestInit = { credentials: "include" };
  const TABLES_FETCH_TIMEOUT_MS = 1500;

  const fetchWithTimeout = async (url: string): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TABLES_FETCH_TIMEOUT_MS);
    try {
      return await fetch(url, {
        ...requestInit,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const tableUrls = API_BASE ? [`${API_BASE}/api/tables`, "/api/tables"] : ["/api/tables"];

  for (const url of tableUrls) {
    try {
      const res = await fetchWithTimeout(url);
      if (!res.ok) {
        continue;
      }

      const data = (await res.json()) as Record<string, JsonValue>[];
      // Convert numeric id to string for frontend type compatibility
      return data.map(mapTableFromBackend);
    } catch {
      // Try next URL fallback.
    }
  }

  throw new Error("Failed to fetch tables");
}

/** POST /api/tables — Add new table */
export async function createTable(label: string): Promise<Table> {
  const data = await requestJson<Record<string, JsonValue>>(
    `${API_BASE}/api/tables`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ label }),
    },
    "Failed to create table"
  );
  return mapTableFromBackend(data);
}

/** PUT /api/tables/:id — Update table label */
export async function updateTable(
  id: string,
  label: string
): Promise<{ success: boolean }> {
  return requestJson<{ success: boolean }>(
    `${API_BASE}/api/tables/${id}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ label }),
    },
    "Failed to update table"
  );
}

/** DELETE /api/tables/:id — Delete table */
export async function deleteTable(
  id: string
): Promise<{ success: boolean }> {
  return requestJson<{ success: boolean }>(
    `${API_BASE}/api/tables/${id}`,
    {
      method: "DELETE",
      credentials: "include",
    },
    "Failed to delete table"
  );
}

/** PUT /api/tables/:id/pin — Set table PIN manually */
export async function setTablePin(
  id: string,
  pin: string
): Promise<{ success: boolean; pin: string }> {
  return requestJson<{ success: boolean; pin: string }>(
    `${API_BASE}/api/tables/${id}/pin`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ pin }),
    },
    "Failed to set PIN"
  );
}

/** POST /api/tables/:id/pin/randomize — Randomize table PIN */
export async function randomizeTablePin(
  id: string
): Promise<{ success: boolean; pin: string; pin_version: number }> {
  return requestJson<{ success: boolean; pin: string; pin_version: number }>(
    `${API_BASE}/api/tables/${id}/pin/randomize`,
    {
      method: "POST",
      credentials: "include",
    },
    "Failed to randomize PIN"
  );
}

// ==========================================================================
// ORDER CRUD
// ==========================================================================

/** GET /api/orders — Fetch all orders (kitchen/manager) */
export async function fetchOrders(): Promise<Order[]> {
  const data = await requestJson<BackendOrder[]>(
    `${API_BASE}/api/orders`,
    { credentials: "include" },
    "Failed to fetch orders"
  );
  return parseOrders(data);
}

/** GET /api/orders/table/:tableId — Fetch orders for one table (customer) */
export async function fetchOrdersForTable(tableId: string): Promise<Order[]> {
  const data = await requestJson<BackendOrder[]>(
    `${API_BASE}/api/orders/table/${tableId}`,
    { credentials: "include" },
    "Failed to fetch table orders"
  );
  return parseOrders(data);
}

/** Transform backend order response to frontend format */
function parseOrders(data: BackendOrder[]): Order[] {
  return data.map((order) => ({
    id: String(order.id),
    table: {
      id: String(order.table_id),
      label: order.table_label ?? `Table ${order.table_id}`,
    },
    items: (order.items ?? []).map((item) => ({
      item: {
        id: String(item.id),
        name: item.name,
        emoji: item.emoji,
        category: "",
      },
      quantity: item.quantity,
    })),
    status: order.status as OrderStatus,
    createdAt: new Date(order.createdAt),
  }));
}

/** POST /api/orders/table/:tableId — Create a new order */
export async function createOrder(orderData: {
  items: { sushiId: string; quantity: number }[];
  tableId: string;
}): Promise<Order> {
  const data = await requestJson<BackendOrder>(
    `${API_BASE}/api/orders/table/${orderData.tableId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        items: orderData.items.map((item) => ({
          id: Number(item.sushiId),
          quantity: item.quantity,
        })),
      }),
    },
    "Failed to create order"
  );
  
  return {
    id: String(data.id),
    table: {
      id: String(data.table_id),
      label: data.table_label ?? `Table ${data.table_id}`,
    },
    items: (data.items ?? []).map((item) => ({
      item: {
        id: String(item.id),
        name: item.name,
        emoji: item.emoji,
        category: "",
      },
      quantity: item.quantity,
    })),
    status: data.status as OrderStatus,
    createdAt: new Date(data.createdAt),
  };
}

/** PATCH /api/orders/:id/status — Update order status */
export async function updateOrderStatus(
  id: string,
  status: OrderStatus
): Promise<{ success: boolean; id: number; status: string }> {
  return requestJson<{ success: boolean; id: number; status: string }>(
    `${API_BASE}/api/orders/${id}/status`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status }),
    },
    "Failed to update order"
  );
}

/** PATCH /api/orders/:id/cancel — Cancel an order (sets status to cancelled) */
export async function cancelOrder(id: string): Promise<{ success: boolean }> {
  return requestJson<{ success: boolean }>(
    `${API_BASE}/api/orders/${id}/cancel`,
    {
      method: "PATCH",
      credentials: "include",
    },
    "Failed to cancel order"
  );
}

/** DELETE /api/orders/:id — Permanently delete an order (manager only) */
export async function deleteOrder(id: string): Promise<{ success: boolean }> {
  return requestJson<{ success: boolean }>(
    `${API_BASE}/api/orders/${id}`,
    {
      method: "DELETE",
      credentials: "include",
    },
    "Failed to delete order"
  );
}

// ==========================================================================
// SETTINGS CRUD  
// ==========================================================================

/** GET /api/settings — Fetch current settings */
export async function fetchSettings(): Promise<OrderSettings> {
  const data = await requestJson<Record<string, JsonValue>>(
    `${API_BASE}/api/settings`,
    { credentials: "include" },
    "Failed to fetch settings"
  );
  // Backend returns string values — coerce to numbers
  return {
    maxItemsPerOrder: Number(data.maxItemsPerOrder ?? 10),
    maxActiveOrdersPerTable: Number(data.maxActiveOrdersPerTable ?? 2),
  };
}

/** PUT /api/settings — Update order settings */
export async function updateSettings(
  updates: Partial<OrderSettings>
): Promise<OrderSettings> {
  return requestJson<OrderSettings>(
    `${API_BASE}/api/settings`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(updates),
    },
    "Failed to update settings"
  );
}

// ==========================================================================
// TABLE PRESENCE HEARTBEAT
// ==========================================================================

/** POST /api/tables/:tableId/heartbeat — Send customer presence heartbeat */
export async function sendPresenceHeartbeat(tableId: string): Promise<void> {
  await fetch(`${API_BASE}/api/tables/${tableId}/heartbeat`, {
    method: "POST",
    credentials: "include",
  }).catch(() => {}); // Best-effort, don't throw
}

/** DELETE /api/tables/:tableId/heartbeat — Clear customer presence on leave */
export async function clearPresenceHeartbeat(tableId: string): Promise<void> {
  await fetch(`${API_BASE}/api/tables/${tableId}/heartbeat`, {
    method: "DELETE",
    credentials: "include",
    keepalive: true,
  }).catch(() => {}); // Best-effort
}