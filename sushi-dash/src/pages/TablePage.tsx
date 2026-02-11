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

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { toast } from "sonner";

import { useSushi } from "@/context/SushiContext";
import {
  SushiGrid,
  OrderQueueList,
  OrderConfirmation,
  CartSummaryBanner,
  SEOHead,
} from "@/components/sushi";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { AlertCircle, Search, X, ChevronDown, Trash2 } from "lucide-react";

import type { SushiItem } from "@/types/sushi";

/** The two steps of the ordering flow */
type Step = "menu" | "confirm";
const TablePage = () => {
  const { tableId } = useParams<{ tableId: string }>();
  
  const { 
    menu, 
    tables, 
    orders, 
    categories, 
    settings,
    placeOrder,
    canTablePlaceOrder,
  } = useSushi();

  // Find the table from the URL param
  const table = tables.find(t => t.id === tableId);

  // ---------------------------------------------------------------------------
  // Local state
  // ---------------------------------------------------------------------------
  const [step, setStep] = useState<Step>("menu");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());

  // ---------------------------------------------------------------------------
  // useRef — reference to the search input for auto-focus
  // ---------------------------------------------------------------------------
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus search input when returning to menu step
  useEffect(() => {
    if (step === "menu" && searchInputRef.current) {
      // Don't steal focus on mobile (keyboard popup is annoying)
      if (window.innerWidth > 768) {
        searchInputRef.current.focus();
      }
    }
  }, [step]);

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

  /** Menu items filtered by the current search query */
  const filteredMenu = useMemo(() => {
    if (!searchQuery.trim()) return menu;
    const query = searchQuery.toLowerCase();
    return menu.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
    );
  }, [menu, searchQuery]);

  /** Filtered items grouped by category for the collapsible view */
  const menuByCategory = useMemo(() => {
    const grouped: Record<string, SushiItem[]> = {};
    for (const item of filteredMenu) {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    }
    return grouped;
  }, [filteredMenu]);

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

  /** Active orders for this table (excludes delivered) */
  const tableOrders = useMemo(
    () =>
      table
        ? orders.filter((o) => o.table.id === table.id && o.status !== "delivered")
        : [],
    [table, orders]
  );

  /** Whether this table has hit its order limit */
  const tableOrderStatus = useMemo(
    () => (table ? canTablePlaceOrder(table.id) : { allowed: true }),
    [table, canTablePlaceOrder]
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
      setStep("menu");
      toast.success("Order sent to the kitchen! 🍣");
    } else {
      toast.error(result.error || "Failed to place order");
    }
  }, [table, totalItems, canTablePlaceOrder, cart, placeOrder]);

  /** Empty the cart */
  const handleClearCart = useCallback(() => {
    setCart({});
    toast.success("Cart cleared");
  }, []);

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
    setStep("menu");
  }, []);

  // Redirect if table not found (after all hooks to satisfy Rules of Hooks)
  if (!table) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      {/* Dynamic SEO — updates <title> for this table */}
      <SEOHead
        title={`${table.label} — Order`}
        description={`Browse and order from 100+ sushi items at ${table.label}. All-you-can-eat menu with real-time order tracking.`}
      />

      {/* STEP 1: Menu Grid */}
      {step === "menu" && (
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <Link
                to="/"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-1 block"
              >
                ← Back to tables
              </Link>
              <h1 className="text-2xl font-display font-bold text-foreground">
                {table.label} — Order
              </h1>
            </div>

            <div className="flex items-center gap-2">
              {totalItems > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearCart}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                  <Button
                    onClick={() => setStep("confirm")}
                    className="font-bold"
                  >
                    Review ({totalItems}) →
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Order Limit Warning */}
          {!tableOrderStatus.allowed && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{tableOrderStatus.reason}</AlertDescription>
            </Alert>
          )}

          {/* Items Counter & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <div className="text-sm text-muted-foreground">
              Items: <span className={totalItems >= settings.maxItemsPerOrder ? "text-destructive font-bold" : "font-medium"}>
                {totalItems}
              </span> / {settings.maxItemsPerOrder} max
            </div>
            
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search menu (e.g. #26 or salmon)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-8"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Cart Summary */}
          <CartSummaryBanner summary={cartSummary} />

          {/* Menu by Category (Collapsible) */}
          {searchQuery ? (
            // Show flat grid when searching
            <div className="mb-6">
              <p className="text-sm text-muted-foreground mb-3">
                {filteredMenu.length} results for "{searchQuery}"
              </p>
              <SushiGrid
                items={filteredMenu}
                cart={cart}
                maxItems={settings.maxItemsPerOrder}
                currentTotal={totalItems}
                onIncrement={handleIncrement}
                onDecrement={handleDecrement}
              />
            </div>
          ) : (
            // Show collapsible categories
            <div className="space-y-3 mb-6">
              {categories.map((category) => {
                const items = menuByCategory[category] || [];
                const cartCount = cartByCategory[category] || 0;
                const isOpen = openCategories.has(category);

                if (items.length === 0) return null;

                return (
                  <Collapsible
                    key={category}
                    open={isOpen}
                    onOpenChange={() => toggleCategory(category)}
                  >
                    <CollapsibleTrigger asChild>
                      <button className="w-full flex items-center justify-between p-4 rounded-xl bg-card border-2 border-border hover:border-primary/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-semibold">{category}</span>
                          <span className="text-sm text-muted-foreground">
                            ({items.length} items)
                          </span>
                          {cartCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                              {cartCount} in cart
                            </span>
                          )}
                        </div>
                        <ChevronDown
                          className={`w-5 h-5 text-muted-foreground transition-transform ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-3">
                      <SushiGrid
                        items={items}
                        cart={cart}
                        maxItems={settings.maxItemsPerOrder}
                        currentTotal={totalItems}
                        onIncrement={handleIncrement}
                        onDecrement={handleDecrement}
                      />
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          )}

          {/* Order Queue */}
          <OrderQueueList
            orders={tableOrders}
            allOrders={orders}
            tableLabel={table.label}
          />
        </div>
      )}

      {/* STEP 2: Order Confirmation */}
      {step === "confirm" && (
        <OrderConfirmation
          table={table}
          cart={cart}
          menu={menu}
          onBack={handleBackToMenu}
          onAddMore={handleBackToMenu}
          onConfirm={handlePlaceOrder}
        />
      )}
    </main>
  );
};

export default TablePage;
