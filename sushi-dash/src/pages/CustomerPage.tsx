import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";

import { useSushi } from "@/context/SushiContext";
import { useAuth } from "@/context/AuthContext";
import {
  TableSelector,
  SushiGrid,
  OrderQueueList,
  OrderConfirmation,
  CartSummaryBanner,
  CollapsibleSection,
  Badge,
  LoginModal,
} from "@/components/sushi";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

import type { Table, SushiItem } from "@/types/sushi";

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

type Step = "table" | "menu" | "confirm";

const CustomerPage = () => {
  const { 
    menu, 
    tables, 
    orders, 
    categories, 
    settings,
    placeOrder,
    canTablePlaceOrder,
  } = useSushi();
  
  const { 
    isInitialized, 
    isAuthenticated, 
    session, 
    loginAsCustomer, 
    logout,
    checkAccess 
  } = useAuth();

  // Navigation state
  const [step, setStep] = useState<Step>("table");
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  // Auth state for table login
  const [pendingTable, setPendingTable] = useState<Table | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

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

  const tableOrders = selectedTable
    ? orders.filter((o) => o.table.id === selectedTable.id && o.status !== "delivered")
    : [];

  // Check if table can place more orders
  const tableOrderStatus = selectedTable 
    ? canTablePlaceOrder(selectedTable.id) 
    : { allowed: true };

  // Restore session on mount
  useEffect(() => {
    if (isInitialized && isAuthenticated && session?.role === 'customer' && session.tableId) {
      const table = tables.find(t => t.id === session.tableId);
      if (table) {
        setSelectedTable(table);
        setStep("menu");
      }
    }
  }, [isInitialized, isAuthenticated, session, tables]);

  // Handlers
  const handleSelectTable = (table: Table) => {
    if (checkAccess('customer', table.id)) {
      setSelectedTable(table);
      setStep("menu");
    } else {
      setPendingTable(table);
      setShowLoginModal(true);
    }
  };

  const handleTableLogin = async (password: string): Promise<boolean> => {
    if (!pendingTable) return false;

    const success = await loginAsCustomer(pendingTable.id, password);
    if (success) {
      setSelectedTable(pendingTable);
      setPendingTable(null);
      setShowLoginModal(false);
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
    if (!selectedTable || totalItems === 0) return;

    const canOrder = canTablePlaceOrder(selectedTable.id);
    if (!canOrder.allowed) {
      toast.error(canOrder.reason || "Cannot place order");
      return;
    }

    const items = Object.entries(cart).map(([sushiId, quantity]) => ({
      sushiId,
      quantity,
    }));

    const result = placeOrder(items, selectedTable);
    
    if (result.success) {
      setCart({});
      setStep("menu");
      toast.success("Order sent to the kitchen! 🍣");
    } else {
      toast.error(result.error || "Failed to place order");
    }
  };

  const resetState = () => {
    setCart({});
    setStep("table");
    setSelectedTable(null);
    setOpenCategories(new Set());
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
    logout();
    resetState();
  };

  const handleBackToMenu = () => {
    setStep("menu");
  };

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 pb-[5.5rem]">
      {/* STEP 1: Table Selection */}
      {step === "table" && (
        <TableSelector tables={tables} onSelectTable={handleSelectTable} />
      )}

      {/* STEP 2: Menu Grid */}
      {step === "menu" && selectedTable && (
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <button
                onClick={handleBackToTables}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-1"
              >
                ← Back to tables
              </button>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-display font-bold text-foreground">
                  {selectedTable.label} — Order
                </h1>
                <span className={`text-xl font-bold ${totalItems >= settings.maxItemsPerOrder ? "text-destructive" : "text-muted-foreground"}`}>
                  {totalItems}/{settings.maxItemsPerOrder}
                </span>
              </div>
            </div>
          </div>

          {/* Order Limit Warning */}
          {!tableOrderStatus.allowed && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{tableOrderStatus.reason}</AlertDescription>
            </Alert>
          )}

          {/* Cart Summary */}
          <CartSummaryBanner 
            summary={cartSummary} 
            onReview={totalItems > 0 ? () => setStep("confirm") : undefined}
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

          {/* Order Queue */}
          <OrderQueueList
            orders={tableOrders}
            allOrders={orders}
            tableLabel={selectedTable.label}
          />
        </div>
      )}

      {/* STEP 3: Order Confirmation */}
      {step === "confirm" && selectedTable && (
        <OrderConfirmation
          table={selectedTable}
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

      {/* Table Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        title={`Login to ${pendingTable?.label || 'Table'}`}
        description="Enter the table password to access the menu"
        placeholder="e.g., table-aura"
        onLogin={handleTableLogin}
        onClose={() => {
          setShowLoginModal(false);
          setPendingTable(null);
        }}
        closeable
      />
    </main>
  );
};

export default CustomerPage;
