/**
 * ==========================================================================
 * React Query Hooks — Data fetching & mutation layer
 * ==========================================================================
 *
 * These custom hooks wrap the mock API with @tanstack/react-query to provide:
 *   - Automatic caching and background refetching
 *   - Optimistic updates for mutations
 *   - Loading and error states
 *   - Cache invalidation after mutations
 *
 * Each hook corresponds to a resource:
 *   useMenuQuery      → GET menu items
 *   useAddMenuItem    → POST a new menu item
 *   useRemoveMenuItem → DELETE a menu item
 *   useTablesQuery    → GET tables
 *   useAddTable       → POST a new table
 *   useRemoveTable    → DELETE a table
 *   useOrdersQuery    → GET orders (auto-polls every 3s for kitchen)
 *   usePlaceOrder     → POST a new order
 *   useUpdateOrder    → PATCH order status
 *   useSettingsQuery  → GET settings
 *   useUpdateSettings → PUT settings
 *
 * Usage: These hooks are consumed by the SushiContext to provide
 * a unified data layer to the rest of the application.
 * ==========================================================================
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api";
import type { SushiItem, Table, OrderStatus, Order } from "@/types/sushi";
import type { OrderSettings } from "@/context/SushiContext";

// ---------------------------------------------------------------------------
// Query Keys — centralised to keep cache invalidation consistent
// ---------------------------------------------------------------------------
export const queryKeys = {
  menu: ["menu"] as const,
  tables: ["tables"] as const,
  orders: ["orders"] as const,
  settings: ["settings"] as const,
};

// ==========================================================================
// MENU HOOKS
// ==========================================================================

/**
 * Fetches the full menu from the API.
 * Cached and only refetches on window focus or after mutations.
 */
export function useMenuQuery() {
  return useQuery({
    queryKey: queryKeys.menu,
    queryFn: api.fetchMenu,
    staleTime: 1000 * 60 * 5, // Consider fresh for 5 minutes
  });
}

/**
 * Mutation: add a new menu item.
 * Invalidates the menu cache so the list re-renders.
 */
export function useAddMenuItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (item: Omit<SushiItem, "id">) => api.createMenuItem(item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.menu });
    },
  });
}

/**
 * Mutation: remove a menu item by ID.
 * Invalidates the menu cache after successful deletion.
 */
export function useRemoveMenuItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.deleteMenuItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.menu });
    },
  });
}

// ==========================================================================
// TABLE HOOKS
// ==========================================================================

/**
 * Fetches all configured tables from the API.
 */
export function useTablesQuery() {
  return useQuery({
    queryKey: queryKeys.tables,
    queryFn: api.fetchTables,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Mutation: create a new table.
 */
export function useAddTable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (label: string) => api.createTable(label),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tables });
    },
  });
}

/**
 * Mutation: delete a table by ID.
 */
export function useRemoveTable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.deleteTable(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tables });
    },
  });
}

// ==========================================================================
// ORDER HOOKS
// ==========================================================================

/**
 * Fetches all orders. Polls every 3 seconds for real-time updates
 * (useful for the kitchen dashboard to see new orders arrive).
 */
export function useOrdersQuery() {
  return useQuery({
    queryKey: queryKeys.orders,
    queryFn: api.fetchOrders,
    refetchInterval: 3000, // Poll every 3 seconds for kitchen real-time
    staleTime: 1000,
  });
}

/**
 * Mutation: place a new order.
 * Requires the current menu and settings for validation.
 */
export function usePlaceOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      items,
      table,
      menu,
      settings,
    }: {
      items: { sushiId: string; quantity: number }[];
      table: Table;
      menu: SushiItem[];
      settings: OrderSettings;
    }) => api.createOrder(items, table, menu, settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });
    },
  });
}

/**
 * Mutation: update an order's status (e.g., queued → preparing → ready → delivered).
 */
export function useUpdateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
      api.updateOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });
    },
  });
}

/**
 * Mutation: cancel an active order (manager only).
 * Changes status to "cancelled".
 * Uses optimistic updates for immediate UI feedback.
 */
export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => api.cancelOrder(orderId),
    // Optimistically update the UI before the mutation completes
    onMutate: async (orderId: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.orders });

      // Snapshot the previous value
      const previousOrders = queryClient.getQueryData<Order[]>(queryKeys.orders);

      // Optimistically update to the new value
      queryClient.setQueryData<Order[]>(queryKeys.orders, (old) => {
        if (!old) return old;
        return old.map((order) =>
          order.id === orderId ? { ...order, status: "cancelled" as OrderStatus } : order
        );
      });

      // Return context with the snapshot
      return { previousOrders };
    },
    // If the mutation fails, roll back to the previous value
    onError: (_err, _orderId, context) => {
      if (context?.previousOrders) {
        queryClient.setQueryData(queryKeys.orders, context.previousOrders);
      }
    },
    // Always refetch after error or success to sync with server
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });
    },
  });
}

/**
 * Mutation: delete a delivered order (manager only).
 * Permanently removes from the order list.
 * Uses optimistic updates for immediate UI feedback.
 */
export function useDeleteOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => api.deleteOrder(orderId),
    // Optimistically update the UI before the mutation completes
    onMutate: async (orderId: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.orders });

      // Snapshot the previous value
      const previousOrders = queryClient.getQueryData<Order[]>(queryKeys.orders);

      // Optimistically update to the new value
      queryClient.setQueryData<Order[]>(queryKeys.orders, (old) => {
        if (!old) return old;
        return old.filter((order) => order.id !== orderId);
      });

      // Return context with the snapshot
      return { previousOrders };
    },
    // If the mutation fails, roll back to the previous value
    onError: (_err, _orderId, context) => {
      if (context?.previousOrders) {
        queryClient.setQueryData(queryKeys.orders, context.previousOrders);
      }
    },
    // Always refetch after error or success to sync with server
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });
    },
  });
}

// ==========================================================================
// SETTINGS HOOKS
// ==========================================================================

/**
 * Fetches order settings (max items per order, max active orders per table).
 */
export function useSettingsQuery() {
  return useQuery({
    queryKey: queryKeys.settings,
    queryFn: api.fetchSettings,
    staleTime: 1000 * 60 * 10, // Settings change rarely
  });
}

/**
 * Mutation: update order settings.
 */
export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newSettings: Partial<OrderSettings>) =>
      api.updateSettings(newSettings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings });
    },
  });
}
