/**
 * ==========================================================================
 * API Layer — Backend REST API for Sushi Dash
 * ==========================================================================
 *
 * Makes actual HTTP requests to the Express.js + PostgreSQL backend.
 * All functions return Promises and handle errors appropriately.
 * ==========================================================================
 */

import type { SushiItem, Table, Order, OrderStatus, Category } from "@/types/sushi";
import type { OrderSettings } from "@/context/SushiContext";

/** Base URL for API requests. Empty in dev (Vite proxies), full URL in production. */
const API = import.meta.env.VITE_API_URL ?? "";

// ==========================================================================
// MENU CRUD
// ==========================================================================

/** GET /api/menu — Fetch all menu items */
export async function fetchMenu(): Promise<SushiItem[]> {
  const res = await fetch(`${API}/api/menu`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch menu");
  const data = await res.json();
  
  // Transform backend response to frontend format
  return data.items.map((item: any) => ({
    id: String(item.id),
    name: item.name,
    emoji: item.emoji,
    category: item.category_name,
    categoryId: item.category_id,
    isPopular: item.is_popular,
    isAvailable: item.is_available,
  }));
}

/** POST /api/menu — Add a new menu item */
export async function createMenuItem(
  item: Omit<SushiItem, "id"> & { categoryId?: number }
): Promise<SushiItem> {
  let categoryId = item.categoryId;
  
  // If no categoryId provided, look it up by name
  if (!categoryId) {
    const categories = await fetchCategories();
    const category = categories.find((c) => c.name === item.category);
    categoryId = category?.id;
  }
  
  const res = await fetch(`${API}/api/menu`, {
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
  const res = await fetch(`${API}/api/menu/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error("Failed to update menu item");
  return res.json();
}

/** PATCH /api/menu/:id/availability — Toggle item availability */
export async function toggleItemAvailability(
  id: string,
  isAvailable: boolean
): Promise<{ success: boolean }> {
  const res = await fetch(`${API}/api/menu/${id}/availability`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ is_available: isAvailable }),
  });
  if (!res.ok) throw new Error("Failed to toggle availability");
  return res.json();
}

/** DELETE /api/menu/:id — Remove a menu item by ID */
export async function deleteMenuItem(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API}/api/menu/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to delete menu item");
  return res.json();
}

// ==========================================================================
// CATEGORY CRUD
// ==========================================================================

/** GET /api/categories — Fetch all categories */
export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${API}/api/categories`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json();
}

/** POST /api/categories — Create a new category */
export async function createCategory(name: string): Promise<Category> {
  const res = await fetch(`${API}/api/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || "Failed to create category");
  }
  return res.json();
}

/** DELETE /api/categories/:id — Delete a category (cascades items) */
export async function deleteCategory(id: number): Promise<{ success: boolean }> {
  const res = await fetch(`${API}/api/categories/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to delete category");
  return res.json();
}

// ==========================================================================
// TABLE CRUD
// ==========================================================================

/** GET /api/tables — Fetch tables with PINs (manager auth required) */
export async function fetchTablesWithPins(): Promise<Table[]> {
  const res = await fetch(`${API}/api/tables`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch tables");
  const data = await res.json();
  // Convert numeric id to string for frontend type compatibility
  return data.map((t: any) => ({
    ...t,
    id: String(t.id),
  }));
}

/** Alias for backward compatibility */
export const fetchTables = fetchTablesWithPins;

/** POST /api/tables — Add new table */
export async function createTable(label: string): Promise<Table> {
  const res = await fetch(`${API}/api/tables`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", 
    body: JSON.stringify({ label }),
  });
  if (!res.ok) throw new Error("Failed to create table");
  const data = await res.json();
  return { ...data, id: String(data.id) };
}

/** PUT /api/tables/:id — Update table label */
export async function updateTable(
  id: string,
  label: string
): Promise<{ success: boolean }> {
  const res = await fetch(`${API}/api/tables/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ label }),
  });
  if (!res.ok) throw new Error("Failed to update table");
  return res.json();
}

/** DELETE /api/tables/:id — Delete table */
export async function deleteTable(
  id: string
): Promise<{ success: boolean }> {
  const res = await fetch(`${API}/api/tables/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to delete table");
  return res.json();
}

/** PUT /api/tables/:id/pin — Set table PIN manually */
export async function setTablePin(
  id: string,
  pin: string
): Promise<{ success: boolean; pin: string }> {
  const res = await fetch(`${API}/api/tables/${id}/pin`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ pin }),
  });
  if (!res.ok) throw new Error("Failed to set PIN");
  return res.json();
}

/** POST /api/tables/:id/pin/randomize — Randomize table PIN */
export async function randomizeTablePin(
  id: string
): Promise<{ success: boolean; pin: string; pin_version: number }> {
  const res = await fetch(`${API}/api/tables/${id}/pin/randomize`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to randomize PIN");
  return res.json();
}

// ==========================================================================
// ORDER CRUD
// ==========================================================================

/** GET /api/orders — Fetch all orders */
export async function fetchOrders(): Promise<Order[]> {
  const res = await fetch(`${API}/api/orders`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch orders");
  const data = await res.json();
  
  // Transform backend response to frontend format
  return data.map((order: any) => ({
    id: String(order.id),
    table: {
      id: String(order.table_id),
      label: order.table_label ?? `Table ${order.table_id}`,
    },
    items: (order.items ?? []).map((item: any) => ({
      sushi: {
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
  const res = await fetch(`${API}/api/orders/table/${orderData.tableId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      items: orderData.items.map(item => ({
        id: Number(item.sushiId),
        quantity: item.quantity,
      })),
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to create order");
  }
  const data = await res.json();
  
  return {
    id: String(data.id),
    table: {
      id: String(data.table_id),
      label: data.table_label ?? `Table ${data.table_id}`,
    },
    items: (data.items ?? []).map((item: any) => ({
      sushi: {
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
  const res = await fetch(`${API}/api/orders/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update order");
  return res.json();
}

/** PATCH /api/orders/:id/cancel — Cancel an order (sets status to cancelled) */
export async function cancelOrder(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API}/api/orders/${id}/cancel`, {
    method: "PATCH",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to cancel order");
  return res.json();
}

/** DELETE /api/orders/:id — Permanently delete an order (manager only) */
export async function deleteOrder(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API}/api/orders/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to delete order");
  return res.json();
}

// ==========================================================================
// SETTINGS CRUD  
// ==========================================================================

/** GET /api/settings — Fetch current settings */
export async function fetchSettings(): Promise<OrderSettings> {
  const res = await fetch(`${API}/api/settings`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch settings");
  const data = await res.json();
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
  const res = await fetch(`${API}/api/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include", 
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error("Failed to update settings");
  return res.json();
}