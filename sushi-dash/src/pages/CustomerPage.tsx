import { useState, useEffect, useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";

import { useSushi } from "@/context/SushiContext";
import { useAuth } from "@/context/AuthContext";
import {
  TableSelector,
  SushiGrid,
  OrderConfirmation,
  CartSummaryBanner,
  CollapsibleSection,
  PinPad,
  StaffLoginModal,
} from "@/components/sushi";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { STATUS_BADGE_VARIANT, STATUS_LABELS } from "@/lib/order-status";

import type { Table, SushiItem, Order } from "@/types/sushi";

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

type Step = "table" | "menu";

const CustomerPage = () => {
  const location = useLocation();

  // When the user clicks the logo from /table/:id, React Router passes
  // { showTableSelect: true } in location.state — skip auto-restore.
  const skipAutoRestore = useRef(
    !!(location.state as { showTableSelect?: boolean } | null)?.showTableSelect
  );

  const { 
    menu, 
    tables, 
    orders, 
    categories, 
    settings,
    placeOrder,
    canTablePlaceOrder,
    cancelOrder,
  } = useSushi();
  
  const { 
    isInitialized, 
    customerSession,
    loginAsCustomer, 
    logout,
  } = useAuth();

  // Customer-specific auth state
  const isCustomerAuthenticated = customerSession !== null;

  // Navigation state
  const [step, setStep] = useState<Step>("table");
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  // Auth state for table login
  const [pendingTable, setPendingTable] = useState<Table | null>(null);
  const [showPinPad, setShowPinPad] = useState(false);

  // Order progress modal
  const [showProgress, setShowProgress] = useState(false);

  // Staff login modal
  const [showStaffLogin, setShowStaffLogin] = useState(false);

  // Order confirmation modal
  const [showConfirm, setShowConfirm] = useState(false);

  // Cancel order confirmation
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

  // Cart state
  const [cart, setCart] = useState<Record<string, number>>({});
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());

  // Derived values
  const totalItems = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  const canAddMore = totalItems < settings.maxItemsPerOrder;

  const cartSummary = Object.entries(cart)
    .map(([id, qty]) => {
      const item = menu.find((m) => m.id === id);
      return item ? `${item.name} (${qty}x)` : null;
    })
    .filter(Boolean)
    .join(", ");

  // Group items by category
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

  // Get cart count per category
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

  // Derive the live table from the tables array so SSE name changes
  // propagate without needing a page refresh
  const liveTable = selectedTable
    ? tables.find((t) => t.id === selectedTable.id) ?? selectedTable
    : null;

  const tableOrders = liveTable
    ? orders.filter((o) => o.table.id === liveTable.id && o.status !== "delivered" && o.status !== "cancelled")
    : [];

  const pendingCount = tableOrders.length;

  /** Global queue position for a given order */
  const getQueuePosition = (orderId: string): number => {
    const globalQueue = orders.filter(
      (o) => o.status === "queued" || o.status === "preparing"
    );
    return globalQueue.findIndex((o) => o.id === orderId) + 1;
  };

  // React to session being cleared (e.g. PIN changed by manager via SSE)
  useEffect(() => {
    if (isInitialized && !isCustomerAuthenticated && step !== "table") {
      setStep("table");
      setSelectedTable(null);
      setCart({});
      setOpenCategories(new Set());
    }
  }, [isInitialized, isCustomerAuthenticated, step]);

  // Prune cart when menu changes (e.g. manager made an item unavailable via SSE)
  useEffect(() => {
    if (menu.length === 0) return; // menu not loaded yet
    setCart((prev) => {
      const menuIds = new Set(menu.map((m) => m.id));
      const removed: string[] = [];
      const next: Record<string, number> = {};
      for (const [id, qty] of Object.entries(prev)) {
        if (menuIds.has(id)) {
          next[id] = qty;
        } else {
          removed.push(id);
        }
      }
      if (removed.length > 0) {
        toast.info(`${removed.length} item(s) removed from your cart — no longer available.`);
        return next;
      }
      return prev; // no change — keep same reference
    });
  }, [menu]);

  // Restore session on mount — verify with backend before auto-restoring.
  // Skip when the user explicitly navigated here (e.g. clicked logo from /table/:id).
  useEffect(() => {
    if (skipAutoRestore.current) {
      skipAutoRestore.current = false;
      return;
    }
    if (isInitialized && isCustomerAuthenticated && customerSession?.tableId) {
      fetch('/api/auth/session', { credentials: 'include' })
        .then(res => res.ok ? res.json() : Promise.reject())
        .then((data: { authenticated: boolean; role?: string; tableId?: number; sessions?: { role: string; tableId?: number | null; authenticated: boolean }[] }) => {
          // Check if customer session is valid (look in sessions array or top-level)
          const customerValid = data.sessions
            ? data.sessions.some(s => s.role === 'customer' && String(s.tableId) === customerSession.tableId)
            : (data.authenticated && data.role === 'customer' && String(data.tableId) === customerSession.tableId);
          if (customerValid) {
            const table = tables.find(t => t.id === customerSession.tableId);
            if (table) {
              setSelectedTable(table);
              setStep("menu");
            }
          } else {
            // Backend session invalid (PIN changed, etc.) — clear stale session
            logout();
          }
        })
        .catch(() => {
          // Backend unreachable or session expired — clear stale session
          logout();
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized]);

  // Handlers
  const handleSelectTable = (table: Table) => {
    // If already authenticated for this table, go straight to menu
    if (isCustomerAuthenticated && customerSession?.tableId === table.id) {
      setSelectedTable(table);
      setStep("menu");
      return;
    }
    // Different table or not authenticated — require PIN
    setPendingTable(table);
    setShowPinPad(true);
  };

  const handlePinSubmit = async (pin: string): Promise<boolean> => {
    if (!pendingTable) return false;

    const success = await loginAsCustomer(pendingTable.id, pin);
    if (success) {
      setSelectedTable(pendingTable);
      setPendingTable(null);
      setShowPinPad(false);
      setStep("menu");
      toast.success(`Welcome to ${pendingTable.label}! 🍣`);
    }
    return success;
  };

  const handleIncrement = (item: SushiItem) => {
    if (!canAddMore) {
      toast.error(`Maximum ${settings.maxItemsPerOrder} items per order`);
      return;
    }
    setCart((prev) => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }));
  };

  const handleDecrement = (item: SushiItem) => {
    setCart((prev) => {
      const current = prev[item.id] || 0;
      if (current <= 1) {
        const { [item.id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [item.id]: current - 1 };
    });
  };

  const handleRemoveItem = (item: SushiItem) => {
    setCart((prev) => {
      const { [item.id]: _, ...rest } = prev;
      return rest;
    });
  };

  const handlePlaceOrder = () => {
    if (!liveTable || totalItems === 0) return;

    const canOrder = canTablePlaceOrder(liveTable.id);
    if (!canOrder.allowed) {
      toast.error(canOrder.reason || "Cannot place order");
      return;
    }

    const items = Object.entries(cart).map(([sushiId, quantity]) => ({
      sushiId,
      quantity,
    }));

    const result = placeOrder(items, liveTable);
    
    if (result.success) {
      setCart({});
      setShowConfirm(false);
      toast.success("Order sent to the kitchen! 🍣");
    } else {
      toast.error(result.error || "Failed to place order");
    }
  };

  const toggleCategory = (category: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const handleBackToTables = () => {
    // Keep session alive — just navigate back to table selection
    setCart({});
    setStep("table");
    setOpenCategories(new Set());
  };

  const handleBackToMenu = () => {
    setShowConfirm(false);
  };

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      {/* STEP 1: Table Selection */}
      {step === "table" && (
        <TableSelector
          tables={tables}
          onSelectTable={handleSelectTable}
          onStaffLogin={() => setShowStaffLogin(true)}
        />
      )}

      {/* STEP 2: Menu Grid */}
      {step === "menu" && liveTable && (
        <div>
          {/* Header — title left, orders counter right */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">
                {liveTable.label} — Order
              </h1>
            </div>

            {/* Pending orders counter — clickable → progress modal */}
            <button
              onClick={() => setShowProgress(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-secondary/80 transition-colors"
              aria-label="View order progress"
            >
              <span className="text-base">{pendingCount >= settings.maxActiveOrdersPerTable ? "⚠️" : "📋"}</span>
              <span className={`text-sm font-bold ${
                pendingCount >= settings.maxActiveOrdersPerTable
                  ? "text-destructive"
                  : "text-muted-foreground"
              }`}>
                {pendingCount}/{settings.maxActiveOrdersPerTable}
              </span>
            </button>
          </div>

          {/* Cart Summary — items counter */}
          <CartSummaryBanner 
            summary={cartSummary} 
            onReview={totalItems > 0 ? () => setShowConfirm(true) : undefined}
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
                    cartCount > 0
                      ? <Badge size="sm">{cartCount} in cart</Badge>
                      : undefined
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
      )}

      {/* Order Confirmation Modal */}
      {liveTable && (
        <OrderConfirmation
          open={showConfirm}
          onOpenChange={setShowConfirm}
          table={liveTable}
          cart={cart}
          menu={menu}
          onBack={handleBackToMenu}
          onAddMore={handleBackToMenu}
          onConfirm={handlePlaceOrder}
          onIncrement={handleIncrement}
          onDecrement={handleDecrement}
          onRemove={handleRemoveItem}
        />
      )}

      {/* Table PIN Pad */}
      <PinPad
        isOpen={showPinPad}
        tableLabel={pendingTable?.label || 'Table'}
        onSubmit={handlePinSubmit}
        onClose={() => {
          setShowPinPad(false);
          setPendingTable(null);
        }}
      />

      {/* Order Progress Modal */}
      <Dialog open={showProgress} onOpenChange={setShowProgress}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg">📋 Order Progress</DialogTitle>
          </DialogHeader>

          {tableOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No pending orders yet. Start picking items!
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {tableOrders.map((order) => {
                const position = getQueuePosition(order.id);
                const itemsSummary = order.items
                  .map((i) => `${i.sushi.name} (${i.quantity}x)`)
                  .join(", ");

                return (
                  <div
                    key={order.id}
                    className="flex items-center justify-between rounded-lg border bg-card px-3 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                        #{position > 0 ? position : "—"}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {itemsSummary}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 ml-2 shrink-0">
                      <Badge variant={STATUS_BADGE_VARIANT[order.status]} size="sm">
                        {STATUS_LABELS[order.status]}
                      </Badge>
                      {order.status === "queued" && (
                        <button
                          onClick={() => setCancellingOrderId(order.id)}
                          className="text-xs text-destructive hover:text-destructive/80 transition-colors font-medium px-1.5 py-0.5 rounded hover:bg-destructive/10"
                          title="Cancel order"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Order Confirmation */}
      <Dialog
        open={!!cancellingOrderId}
        onOpenChange={(open) => !open && setCancellingOrderId(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this order? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancellingOrderId(null)}>
              Keep
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (cancellingOrderId) {
                  cancelOrder(cancellingOrderId);
                  toast.info("Order cancelled");
                }
                setCancellingOrderId(null);
              }}
            >
              Cancel Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Staff Login Modal */}
      <StaffLoginModal
        isOpen={showStaffLogin}
        onClose={() => setShowStaffLogin(false)}
      />
    </main>
  );
};

export default CustomerPage;
