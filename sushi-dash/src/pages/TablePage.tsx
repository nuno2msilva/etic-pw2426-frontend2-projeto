/**
 * ==========================================================================
 * TablePage — Customer ordering page for a specific table
 * ==========================================================================
 *
 * Accessed via /table/:tableId — no password required.
 * Customers can:
 *   1. Browse the full menu (grouped by collapsible categories)
 *   2. Search items by name or number
 *   3. Add/remove items to a cart using +/- buttons
 *   4. Review their order and send it to the kitchen
 *   5. Track active orders in a queue view
 *
 * Performance optimisations:
 *   - useMemo: filtered menu, grouped menu by category, cart counts
 *   - useCallback: all event handlers (increment, decrement, etc.)
 *   - useRef: search input auto-focus on mount
 *
 * Route: /table/:tableId
 * Auth: None required (direct access)
 * ==========================================================================
 */

import { useState, useMemo, useCallback, useEffect } from "react";
import { useParams, useSearchParams, Navigate } from "react-router-dom";
import { toast } from "sonner";

import { useSushi } from "@/context/SushiContext";
import { useAuth } from "@/context/AuthContext";
import {
  SushiGrid,
  OrderConfirmation,
  CartSummaryBanner,
  CollapsibleSection,
  SEOHead,
  OrderProgressModal,
} from "@/components/sushi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { SushiItem } from "@/types/sushi";

/** Emoji icons for each menu category */
const CATEGORY_EMOJI: Record<string, string> = {
  "Nigiri": "🍣",
  "Rolls": "🍙",
  "Specialty Rolls": "👑",
  "Sashimi": "🐟",
  "Hot Dishes": "🍗",
  "Sides": "🥗",
  "Noodles": "🍜",
  "Drinks": "🍵",
  "Desserts": "🍡",
};

/** The two steps of the ordering flow */
const TablePage = () => {
  const { tableId } = useParams<{ tableId: string }>();
  const [searchParams] = useSearchParams();
  
  const { 
    menu, 
    tables, 
    orders, 
    categories, 
    settings,
    isLoading,
    placeOrder,
    cancelOrder,
    canTablePlaceOrder,
  } = useSushi();

  const { loginAsCustomer, authenticatedTableId } = useAuth();

  // Track whether PIN auto-auth is in progress (prevents premature redirect)
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Find the table from the URL param
  const table = tables.find(t => t.id === tableId);

  // Auto-authenticate from QR code ?pin= param, then strip it from the URL
  useEffect(() => {
    const pin = searchParams.get("pin");
    if (pin && tableId) {
      setIsAuthenticating(true);
      loginAsCustomer(tableId, pin)
        .then((ok) => {
          if (ok) {
            toast.success(`Welcome! 🍣`);
            // Remove PIN from URL so it isn't visible or re-used on return visits
            const url = new URL(window.location.href);
            url.searchParams.delete("pin");
            window.history.replaceState({}, "", url.pathname + url.search);
          }
        })
        .catch(() => { /* silently ignore */ })
        .finally(() => setIsAuthenticating(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------------------
  // Local state
  // ---------------------------------------------------------------------------
  const [cart, setCart] = useState<Record<string, number>>({});
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());
  const [showProgress, setShowProgress] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ---------------------------------------------------------------------------
  // useMemo — derived/computed values, only recalculate when deps change
  // ---------------------------------------------------------------------------

  /** Total items currently in the cart */
  const totalItems = useMemo(
    () => Object.values(cart).reduce((sum, qty) => sum + qty, 0),
    [cart]
  );

  /** Whether the customer can add more items (hasn't hit the limit) */
  const canAddMore = useMemo(
    () => totalItems < settings.maxItemsPerOrder,
    [totalItems, settings.maxItemsPerOrder]
  );

  /** Human-readable cart summary string, e.g. "#1 Salmon Nigiri (2x), ..." */
  const cartSummary = useMemo(() => {
    return Object.entries(cart)
      .map(([id, qty]) => {
        const item = menu.find((m) => m.id === id);
        return item ? `${item.name} (${qty}x)` : null;
      })
      .filter(Boolean)
      .join(", ");
  }, [cart, menu]);

  /** Menu items grouped by category for the collapsible view */
  const menuByCategory = useMemo(() => {
    const grouped: Record<string, SushiItem[]> = {};
    for (const item of menu) {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    }
    return grouped;
  }, [menu]);

  /** Count of items in cart per category (for category badges) */
  const cartByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const [id, qty] of Object.entries(cart)) {
      const item = menu.find((m) => m.id === id);
      if (item) {
        counts[item.category] = (counts[item.category] || 0) + qty;
      }
    }
    return counts;
  }, [cart, menu]);

  /** Active orders for this table (excludes delivered and cancelled) */
  const tableOrders = useMemo(
    () =>
      table
        ? orders.filter((o) => o.table.id === table.id && o.status !== "delivered" && o.status !== "cancelled")
        : [],
    [table, orders]
  );

  /** Whether this table has hit its order limit */
  const tableOrderStatus = useMemo(
    () => (table ? canTablePlaceOrder(table.id) : { allowed: true }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [table, canTablePlaceOrder, orders]
  );

  // ---------------------------------------------------------------------------
  // useCallback — stable event handler references for child components
  // (Must be declared before any early returns to satisfy Rules of Hooks)
  // ---------------------------------------------------------------------------

  /** Add one unit of an item to the cart */
  const handleIncrement = useCallback((item: SushiItem) => {
    if (totalItems >= settings.maxItemsPerOrder) {
      toast.error(`Maximum ${settings.maxItemsPerOrder} items per order`);
      return;
    }
    setCart((prev) => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }));
  }, [totalItems, settings.maxItemsPerOrder]);

  /** Remove one unit of an item from the cart */
  const handleDecrement = useCallback((item: SushiItem) => {
    setCart((prev) => {
      const current = prev[item.id] || 0;
      if (current <= 1) {
        const { [item.id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [item.id]: current - 1 };
    });
  }, []);

  /** Remove an item entirely from the cart */
  const handleRemoveItem = useCallback((item: SushiItem) => {
    setCart((prev) => {
      const { [item.id]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  /** Submit the order to the kitchen */
  const handlePlaceOrder = useCallback(() => {
    if (!table || totalItems === 0) return;

    // Check if table can place order
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

  /** Toggle a category section open/closed */
  const toggleCategory = useCallback((category: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  /** Navigate back to the menu step */
  const handleBackToMenu = useCallback(() => {
    setShowConfirm(false);
  }, []);

  /** Clear the entire cart */
  const handleClearCart = useCallback(() => {
    setCart({});
    toast.info("Cart cleared");
  }, []);

  // Show loading while tables are still being fetched or PIN auth is running
  if (isLoading || isAuthenticating) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-5xl mb-4">🍣</p>
          <p className="text-lg">Loading...</p>
        </div>
      </main>
    );
  }

  // Redirect if table not found or user is not authenticated for this table
  if (!table || authenticatedTableId !== tableId) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 pb-[5.5rem]">
      {/* Dynamic SEO — updates <title> for this table */}
      <SEOHead
        title={`${table.label} — Order`}
        description={`Browse and order from 100+ sushi items at ${table.label}. All-you-can-eat menu with real-time order tracking.`}
      />

      {/* Menu Grid */}
      <div>
          {/* Header — title left, orders counter right */}
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-display font-bold text-foreground">
              {table.label} — Order
            </h1>

            {/* Pending orders counter — clickable → progress modal */}
            <button
              onClick={() => setShowProgress(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-secondary/80 transition-colors"
              aria-label="View order progress"
            >
              <span className="text-base">{!tableOrderStatus.allowed ? "⚠️" : "📋"}</span>
              <span className={`text-sm font-bold ${
                !tableOrderStatus.allowed
                  ? "text-destructive"
                  : "text-muted-foreground"
              }`}>
                {tableOrders.length}/{settings.maxActiveOrdersPerTable}
              </span>
            </button>
          </div>

          {/* Cart Summary */}
          <CartSummaryBanner 
            summary={cartSummary} 
            onReview={totalItems > 0 ? () => setShowConfirm(true) : undefined}
            onClear={totalItems > 0 ? handleClearCart : undefined}
            totalItems={totalItems}
            maxItems={settings.maxItemsPerOrder}
          />

          {/* Menu by Category (Collapsible) */}
            <div className="space-y-3">
              {categories.map((category) => {
                const items = menuByCategory[category] || [];
                const cartCount = cartByCategory[category] || 0;
                const isOpen = openCategories.has(category);

                if (items.length === 0) return null;

                return (
                  <CollapsibleSection
                    key={category}
                    title={category}
                    icon={CATEGORY_EMOJI[category] || '📋'}
                    badge={
                      cartCount > 0 ? (
                        <Badge size="sm">
                          {cartCount} in cart
                        </Badge>
                      ) : undefined
                    }
                    open={isOpen}
                    onToggle={() => toggleCategory(category)}
                  >
                    <SushiGrid
                      items={items}
                      cart={cart}
                      maxItems={settings.maxItemsPerOrder}
                      currentTotal={totalItems}
                      onIncrement={handleIncrement}
                      onDecrement={handleDecrement}
                    />
                  </CollapsibleSection>
                );
              })}
            </div>

      </div>

      {/* Order Progress Modal */}
      <OrderProgressModal
        open={showProgress}
        onOpenChange={setShowProgress}
        orders={tableOrders}
        allOrders={orders}
        onCancelOrder={cancelOrder}
      />

      {/* Order Confirmation Modal */}
      <OrderConfirmation
        open={showConfirm}
        onOpenChange={setShowConfirm}
        table={table}
        cart={cart}
        menu={menu}
        onBack={handleBackToMenu}
        onAddMore={handleBackToMenu}
        onConfirm={handlePlaceOrder}
        onIncrement={handleIncrement}
        onDecrement={handleDecrement}
        onRemove={handleRemoveItem}
      />
    </main>
  );
};

export default TablePage;
