// useApiQueries — React Query hooks for all CRUD operations (menu, tables, orders, settings, categories).

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api";
import type { MenuItem, Table, OrderStatus, Order, OrderSettings } from "@/types/models";

// ---------------------------------------------------------------------------
// Query Keys — centralised to keep cache invalidation consistent
// ---------------------------------------------------------------------------
export const queryKeys = {
  menu: ["menu"] as const,
  tables: ["tables"] as const,
  orders: ["orders"] as const,
  settings: ["settings"] as const,
  categories: ["categories"] as const,
};

// Menu hooks

// Fetches the full menu with 5-min cache and 30s polling fallback
export function useMenuQuery() {
  return useQuery({
    queryKey: queryKeys.menu,
    queryFn: api.fetchMenu,
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 30, // 30 s polling fallback if SSE drops
  });
}

// Mutation: adds a new menu item and invalidates the menu cache
export function useAddMenuItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (item: Omit<MenuItem, "id">) => api.createMenuItem(item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.menu });
    },
  });
}

// Mutation: deletes a menu item by ID and invalidates the cache
export function useRemoveMenuItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.deleteMenuItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.menu });
    },
  });
}

// Mutation: updates a menu item and invalidates the cache
export function useUpdateMenuItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: { name?: string; emoji?: string; category_id?: number; is_popular?: boolean } }) =>
      api.updateMenuItem(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.menu });
    },
  });
}

// Mutation: toggles item availability and invalidates the cache
export function useToggleItemAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isAvailable }: { id: string; isAvailable: boolean }) =>
      api.toggleItemAvailability(id, isAvailable),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.menu });
    },
  });
}

// Category hooks

// Fetches all categories with 5-min cache
export function useCategoriesQuery() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: api.fetchCategories,
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 30,
  });
}

// Mutation: adds a new category and invalidates categories + menu caches
export function useAddCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => api.createCategory(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
      queryClient.invalidateQueries({ queryKey: queryKeys.menu });
    },
  });
}

// Mutation: deletes a category and invalidates categories + menu caches
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
      queryClient.invalidateQueries({ queryKey: queryKeys.menu });
    },
  });
}

// Table hooks

// Fetches all tables with PIN info
export function useTablesQuery() {
  return useQuery({
    queryKey: queryKeys.tables,
    queryFn: api.fetchTablesWithPins,
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 30,
  });
}

// Mutation: creates a new table
export function useAddTable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (label: string) => api.createTable(label),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tables });
    },
  });
}

// Mutation: updates a table's label
export function useUpdateTable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, label }: { id: string; label: string }) => api.updateTable(id, label),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tables });
    },
  });
}

// Mutation: deletes a table by ID
export function useRemoveTable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.deleteTable(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tables });
    },
  });
}

// Order hooks

// Fetches orders — scoped to a table for customers, or all orders for staff
export function useOrdersQuery(tableId?: string | null, enabled = true) {
  return useQuery({
    queryKey: tableId ? [...queryKeys.orders, tableId] : queryKeys.orders,
    queryFn: () => tableId ? api.fetchOrdersForTable(tableId) : api.fetchOrders(),
    enabled,
    staleTime: 1000,
    refetchInterval: enabled ? 1000 : false, // 1 s polling fallback — essential for kitchen/customer UX
  });
}

// Mutation: places a new order and invalidates the orders cache
export function usePlaceOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      items,
      table,
    }: {
      items: { sushiId: string; quantity: number }[];
      table: Table;
    }) => api.createOrder({ items, tableId: table.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });
    },
  });
}

// Mutation: advances an order's status through the workflow
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

// Mutation: cancels an order with optimistic UI update (manager only)
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

// Mutation: deletes a delivered order with optimistic UI update (manager only)
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

// Settings hooks

// Fetches order settings (max items, max active orders)
export function useSettingsQuery() {
  return useQuery({
    queryKey: queryKeys.settings,
    queryFn: api.fetchSettings,
    staleTime: 1000 * 60 * 10,
    refetchInterval: 1000 * 30,
  });
}

// Mutation: updates order settings
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
