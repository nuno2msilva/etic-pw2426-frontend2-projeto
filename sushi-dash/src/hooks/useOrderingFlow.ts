/** useOrderingFlow — shared cart state, derived values, and order handlers for TablePage & CustomerPage */

import { useState, useMemo, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { useApp } from "@/context/AppContext";
import type { MenuItem, Table, Order } from "@/types/models";

export interface OrderingFlow {
  // State
  cart: Record<string, number>;
  setCart: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  openCategories: Set<string>;
  setOpenCategories: React.Dispatch<React.SetStateAction<Set<string>>>;
  showConfirm: boolean;
  setShowConfirm: (v: boolean) => void;
  showProgress: boolean;
  setShowProgress: (v: boolean) => void;

  // Derived
  totalItems: number;
  canAddMore: boolean;
  cartSummary: string;
  menuByCategory: Record<string, MenuItem[]>;
  cartByCategory: Record<string, number>;
  tableOrders: Order[];
  tableOrderStatus: { allowed: boolean; reason?: string };

  // Handlers
  handleIncrement: (item: MenuItem) => void;
  handleDecrement: (item: MenuItem) => void;
  handleRemoveItem: (item: MenuItem) => void;
  handlePlaceOrder: () => void;
  handleClearCart: () => void;
  toggleCategory: (category: string) => void;
  handleBackToMenu: () => void;
}

/**
 * Shared ordering flow hook.
 * @param table - The active table (null = not yet selected)
 */
export function useOrderingFlow(table: Table | null | undefined): OrderingFlow {
  const { menu, orders, settings, placeOrder, canTablePlaceOrder } = useApp();

  // ── State ─────────────────────────────────────────────────────────────────
  const [cart, setCart] = useState<Record<string, number>>({});
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());
  const [showConfirm, setShowConfirm] = useState(false);
  const [showProgress, setShowProgress] = useState(false);

  // ── Derived values ────────────────────────────────────────────────────────

  const totalItems = useMemo(
    () => Object.values(cart).reduce((sum, qty) => sum + qty, 0),
    [cart],
  );

  const canAddMore = useMemo(
    () => totalItems < settings.maxItemsPerOrder,
    [totalItems, settings.maxItemsPerOrder],
  );

  const cartSummary = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, qty]) => {
          const item = menu.find((m) => m.id === id);
          return item ? `${item.name} (${qty}x)` : null;
        })
        .filter(Boolean)
        .join(", "),
    [cart, menu],
  );

  const menuByCategory = useMemo(() => {
    const grouped: Record<string, MenuItem[]> = {};
    for (const item of menu) {
      (grouped[item.category] ??= []).push(item);
    }
    return grouped;
  }, [menu]);

  const cartByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const [id, qty] of Object.entries(cart)) {
      const item = menu.find((m) => m.id === id);
      if (item) counts[item.category] = (counts[item.category] || 0) + qty;
    }
    return counts;
  }, [cart, menu]);

  const tableOrders = useMemo(
    () =>
      table
        ? orders.filter(
            (o) =>
              o.table.id === table.id &&
              o.status !== "delivered" &&
              o.status !== "cancelled",
          )
        : [],
    [table, orders],
  );

  const tableOrderStatus = useMemo(
    () => (table ? canTablePlaceOrder(table.id) : { allowed: true }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [table, canTablePlaceOrder, orders],
  );

  // ── Prune cart when menu changes (e.g. item deleted by manager via SSE) ──
  useEffect(() => {
    if (menu.length === 0) return;
    setCart((prev) => {
      const menuIds = new Set(menu.map((m) => m.id));
      const next: Record<string, number> = {};
      let removed = 0;
      for (const [id, qty] of Object.entries(prev)) {
        if (menuIds.has(id)) next[id] = qty;
        else removed++;
      }
      if (removed > 0) {
        toast.info(`${removed} item(s) removed from your cart — no longer available.`);
        return next;
      }
      return prev;
    });
  }, [menu]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleIncrement = useCallback(
    (item: MenuItem) => {
      if (item.isAvailable === false) return;
      if (totalItems >= settings.maxItemsPerOrder) {
        toast.error(`Maximum ${settings.maxItemsPerOrder} items per order`);
        return;
      }
      setCart((prev) => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }));
    },
    [totalItems, settings.maxItemsPerOrder],
  );

  const handleDecrement = useCallback((item: MenuItem) => {
    setCart((prev) => {
      const current = prev[item.id] || 0;
      if (current <= 1) {
        const { [item.id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [item.id]: current - 1 };
    });
  }, []);

  const handleRemoveItem = useCallback((item: MenuItem) => {
    setCart((prev) => {
      const { [item.id]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const handlePlaceOrder = useCallback(() => {
    if (!table || totalItems === 0) return;

    const canOrder = canTablePlaceOrder(table.id);
    if (!canOrder.allowed) {
      toast.error(canOrder.reason || "Cannot place order");
      return;
    }

    const items = Object.entries(cart).map(([sushiId, quantity]) => ({
      sushiId,
      quantity,
    }));

    const result = placeOrder(items, table);
    if (result.success) {
      setCart({});
      setShowConfirm(false);
      toast.success("Order sent to the kitchen! 🍣");
    } else {
      toast.error(result.error || "Failed to place order");
    }
  }, [table, totalItems, canTablePlaceOrder, cart, placeOrder]);

  const handleClearCart = useCallback(() => {
    setCart({});
    toast.info("Cart cleared");
  }, []);

  const toggleCategory = useCallback((category: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }, []);

  const handleBackToMenu = useCallback(() => {
    setShowConfirm(false);
  }, []);

  return {
    cart,
    setCart,
    openCategories,
    setOpenCategories,
    showConfirm,
    setShowConfirm,
    showProgress,
    setShowProgress,
    totalItems,
    canAddMore,
    cartSummary,
    menuByCategory,
    cartByCategory,
    tableOrders,
    tableOrderStatus,
    handleIncrement,
    handleDecrement,
    handleRemoveItem,
    handlePlaceOrder,
    handleClearCart,
    toggleCategory,
    handleBackToMenu,
  };
}
