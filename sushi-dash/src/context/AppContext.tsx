// AppContext — central state provider: menu, tables, orders, settings via React Query + Context API.

import React, { createContext, useContext, useCallback, useMemo, useRef } from "react";
import type { MenuItem, Table, Order, OrderStatus, Category, OrderSettings } from "@/types/models";
import { DEFAULT_SETTINGS } from "@/data/seedData";
import { useAuth } from "@/context/AuthContext";
import {
  useMenuQuery,
  useAddMenuItem,
  useRemoveMenuItem,
  useUpdateMenuItem,
  useToggleItemAvailability,
  useTablesQuery,
  useAddTable,
  useUpdateTable,
  useRemoveTable,
  useOrdersQuery,
  usePlaceOrder,
  useUpdateOrder,
  useCancelOrder,
  useDeleteOrder,
  useSettingsQuery,
  useUpdateSettings,
  useCategoriesQuery,
  useAddCategory,
  useDeleteCategory,
} from "@/hooks/useApiQueries";

// Re-export OrderSettings so existing consumers don't break
export type { OrderSettings } from "@/types/models";

// Context type — all data and actions available to consumers via useApp()
interface AppContextType {
  /** Full menu item list */
  menu: MenuItem[];
  /** Configured restaurant tables */
  tables: Table[];
  /** Optional tables load error message */
  tablesError: string | null;
  /** All orders (active + delivered) */
  orders: Order[];
  /** Derived: unique category names from menu */
  categories: string[];
  /** Full category objects from DB */
  categoryList: Category[];
  /** Current order limit settings */
  settings: OrderSettings;
  /** Whether data is still loading from the API */
  isLoading: boolean;

  // Menu CRUD
  addMenuItem: (item: Omit<MenuItem, "id"> & { categoryId?: number }) => void;
  removeMenuItem: (id: string) => void;
  updateMenuItem: (id: string, updates: { name?: string; emoji?: string; category_id?: number; is_popular?: boolean }) => void;
  toggleItemAvailability: (id: string, isAvailable: boolean) => void;

  // Category CRUD
  addCategory: (name: string) => void;
  deleteCategory: (id: number) => void;

  // Table CRUD
  addTable: (label: string) => Promise<void>;
  updateTable: (id: string, label: string) => Promise<void>;
  removeTable: (id: string) => Promise<void>;
  /** Retry table fetch */
  reloadTables: () => Promise<unknown>;

  // Orders
  placeOrder: (
    items: { sushiId: string; quantity: number }[],
    table: Table
  ) => { success: boolean; error?: string };
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  cancelOrder: (orderId: string) => void;
  deleteOrder: (orderId: string) => void;
  getQueuePosition: (orderId: string) => number;

  // Settings
  updateSettings: (newSettings: Partial<OrderSettings>) => void;

  // Validation helpers
  getActiveOrdersForTable: (tableId: string) => Order[];
  canTablePlaceOrder: (tableId: string) => { allowed: boolean; reason?: string };
}

// Context + consumer hook
const AppContext = createContext<AppContextType | null>(null);

// Custom hook to access the Sushi context. Must be called within a <AppProvider>.
export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};

// Provider Component

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Auth — determines whether to fetch all orders or just for the customer's table
  const { authenticatedTableId, staffSession } = useAuth();
  const isStaff = staffSession !== null;

  // React Query hooks — fetch data from the backend API
  const menuQuery = useMenuQuery();
  const tablesQuery = useTablesQuery();
  // Staff (kitchen/manager) fetch all orders; customers fetch only their table
  const ordersQuery = useOrdersQuery(isStaff ? undefined : authenticatedTableId);
  const settingsQuery = useSettingsQuery();
  const categoriesQuery = useCategoriesQuery();

  // Mutation hooks
  const addMenuMutation = useAddMenuItem();
  const removeMenuMutation = useRemoveMenuItem();
  const updateMenuMutation = useUpdateMenuItem();
  const toggleAvailMutation = useToggleItemAvailability();
  const addCategoryMutation = useAddCategory();
  const deleteCategoryMutation = useDeleteCategory();
  const addTableMutation = useAddTable();
  const updateTableMutation = useUpdateTable();
  const removeTableMutation = useRemoveTable();
  const placeOrderMutation = usePlaceOrder();
  const updateOrderMutation = useUpdateOrder();
  const cancelOrderMutation = useCancelOrder();
  const deleteOrderMutation = useDeleteOrder();
  const updateSettingsMutation = useUpdateSettings();

  // Derived data with defaults for loading states — wrapped in useMemo to maintain stable references and avoid re-renders
  const menu = useMemo(() => menuQuery.data ?? [], [menuQuery.data]);
  const tables = useMemo(() => tablesQuery.data ?? [], [tablesQuery.data]);
  const tablesError = tablesQuery.error instanceof Error ? tablesQuery.error.message : null;
  const orders = useMemo(() => ordersQuery.data ?? [], [ordersQuery.data]);
  const categoryList = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);
  const settings = settingsQuery.data ?? DEFAULT_SETTINGS;
  const isLoading = menuQuery.isLoading || tablesQuery.isLoading;

  // useRef — mutable refs to always read the latest data inside callbacks without needing them as dependencies (avoids stale closures)
  const menuRef = useRef(menu);
  menuRef.current = menu;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const ordersRef = useRef(orders);
  ordersRef.current = orders;

  // useMemo — derive unique categories from the menu (only recalculates when the menu array reference changes)
  const categories = useMemo(() => {
    const cats = new Set(menu.map((m) => m.category));
    return Array.from(cats);
  }, [menu]);

  // useCallback — memoised action handlers to prevent child re-renders

  /** Returns active (non-delivered, non-cancelled) orders for a specific table */
  const getActiveOrdersForTable = useCallback(
    (tableId: string): Order[] => {
      return ordersRef.current.filter(
        (o) => o.table.id === tableId && o.status !== "delivered" && o.status !== "cancelled"
      );
    },
    []
  );

  /** Checks whether a table can place a new order based on limits */
  const canTablePlaceOrder = useCallback(
    (tableId: string): { allowed: boolean; reason?: string } => {
      const activeOrders = getActiveOrdersForTable(tableId);
      if (activeOrders.length >= settingsRef.current.maxActiveOrdersPerTable) {
        return {
          allowed: false,
          reason: `Maximum ${settingsRef.current.maxActiveOrdersPerTable} active orders per table. Please wait for current orders to be delivered.`,
        };
      }
      return { allowed: true };
    },
    [getActiveOrdersForTable]
  );

  /** Add a new item to the menu via the API */
  const addMenuItem = useCallback(
    (item: Omit<MenuItem, "id"> & { categoryId?: number }) => {
      addMenuMutation.mutate(item);
    },
    [addMenuMutation]
  );

  /** Remove a menu item by ID */
  const removeMenuItem = useCallback(
    (id: string) => {
      removeMenuMutation.mutate(id);
    },
    [removeMenuMutation]
  );

  /** Update a menu item (name, emoji, etc.) */
  const updateMenuItemAction = useCallback(
    (id: string, updates: { name?: string; emoji?: string; category_id?: number; is_popular?: boolean }) => {
      updateMenuMutation.mutate({ id, updates });
    },
    [updateMenuMutation]
  );

  /** Toggle item availability */
  const toggleItemAvailability = useCallback(
    (id: string, isAvailable: boolean) => {
      toggleAvailMutation.mutate({ id, isAvailable });
    },
    [toggleAvailMutation]
  );

  /** Add a new category */
  const addCategory = useCallback(
    (name: string) => {
      addCategoryMutation.mutate(name);
    },
    [addCategoryMutation]
  );

  /** Delete a category */
  const deleteCategoryAction = useCallback(
    (id: number) => {
      deleteCategoryMutation.mutate(id);
    },
    [deleteCategoryMutation]
  );

  /** Add a new table */
  const addTable = useCallback(
    async (label: string) => {
      await addTableMutation.mutateAsync(label);
    },
    [addTableMutation]
  );
  /** Update table label */
  const updateTable = useCallback(
    async (id: string, label: string) => {
      await updateTableMutation.mutateAsync({ id, label });
    },
    [updateTableMutation]
  );
  /** Remove a table by ID */
  const removeTable = useCallback(
    async (id: string) => {
      await removeTableMutation.mutateAsync(id);
    },
    [removeTableMutation]
  );

  /** Retry loading tables from API */
  const reloadTables = useCallback(async () => {
    return tablesQuery.refetch();
  }, [tablesQuery]);

  // Place an order — validates limits, then calls the API. Returns synchronous result for immediate UI feedback.
  const placeOrder = useCallback(
    (
      items: { sushiId: string; quantity: number }[],
      table: Table
    ): { success: boolean; error?: string } => {
      const canOrder = canTablePlaceOrder(table.id);
      if (!canOrder.allowed) {
        return { success: false, error: canOrder.reason };
      }

      const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
      if (totalItems > settingsRef.current.maxItemsPerOrder) {
        return {
          success: false,
          error: `Maximum ${settingsRef.current.maxItemsPerOrder} items per order. You have ${totalItems} items.`,
        };
      }

      placeOrderMutation.mutate({
        items,
        table,
      });

      return { success: true };
    },
    [canTablePlaceOrder, placeOrderMutation]
  );

  /** Update an order's status (kitchen workflow) */
  const updateOrderStatus = useCallback(
    (orderId: string, status: OrderStatus) => {
      updateOrderMutation.mutate({ orderId, status });
    },
    [updateOrderMutation]
  );

  /** Cancel an active order (manager only) */
  const cancelOrder = useCallback(
    (orderId: string) => {
      cancelOrderMutation.mutate(orderId);
    },
    [cancelOrderMutation]
  );

  /** Delete a delivered order (manager only) */
  const deleteOrder = useCallback(
    (orderId: string) => {
      deleteOrderMutation.mutate(orderId);
    },
    [deleteOrderMutation]
  );

  /** Get queue position of an order (1-based, -1 if not found) */
  const getQueuePosition = useCallback(
    (orderId: string) => {
      const pending = ordersRef.current.filter(
        (o) => o.status === "queued" || o.status === "preparing"
      );
      const idx = pending.findIndex((o) => o.id === orderId);
      return idx === -1 ? -1 : idx + 1;
    },
    []
  );

  /** Update order limit settings via the API */
  const updateSettingsAction = useCallback(
    (newSettings: Partial<OrderSettings>) => {
      updateSettingsMutation.mutate(newSettings);
    },
    [updateSettingsMutation]
  );

  // useMemo — memoise the entire context value object so consumers only re-render when actual data changes, not on every provider render
  const value: AppContextType = useMemo(
    () => ({
      menu,
      tables,
      tablesError,
      orders,
      categories,
      categoryList,
      settings,
      isLoading,
      addMenuItem,
      removeMenuItem,
      updateMenuItem: updateMenuItemAction,
      toggleItemAvailability,
      addCategory,
      deleteCategory: deleteCategoryAction,
      addTable,
      updateTable,
      removeTable,
      reloadTables,
      placeOrder,
      updateOrderStatus,
      cancelOrder,
      deleteOrder,
      getQueuePosition,
      updateSettings: updateSettingsAction,
      getActiveOrdersForTable,
      canTablePlaceOrder,
    }),
    [
      menu,
      tables,
      orders,
      categories,
      categoryList,
      settings,
      isLoading,
      addMenuItem,
      removeMenuItem,
      updateMenuItemAction,
      toggleItemAvailability,
      addCategory,
      deleteCategoryAction,
      addTable,
      updateTable,
      removeTable,
      reloadTables,
      placeOrder,
      updateOrderStatus,
      cancelOrder,
      deleteOrder,
      getQueuePosition,
      updateSettingsAction,
      getActiveOrdersForTable,
      canTablePlaceOrder,
      tablesError,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
