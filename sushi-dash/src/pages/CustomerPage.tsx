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
  LoginModal,
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

import type { Table, SushiItem } from "@/types/sushi";

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
  const [searchQuery, setSearchQuery] = useState("");
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

  // Filter menu by search query
  const filteredMenu = useMemo(() => {
    if (!searchQuery.trim()) return menu;
    const query = searchQuery.toLowerCase();
    return menu.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
    );
  }, [menu, searchQuery]);

  // Group filtered items by category
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
    // Check if already authenticated for this table
    if (checkAccess('customer', table.id)) {
      setSelectedTable(table);
      setStep("menu");
    } else {
      // Need to login for this table
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

  // Quick increment/decrement handlers
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

  const handlePlaceOrder = () => {
    if (!selectedTable || totalItems === 0) return;

    // Check if table can place order
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
    setSearchQuery("");
    setOpenCategories(new Set());
  };

  const handleClearCart = () => {
    setCart({});
    toast.success("Cart cleared");
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
    <main className="max-w-5xl mx-auto px-4 py-8">
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
              <h1 className="text-2xl font-display font-bold text-foreground">
                {selectedTable.label} — Order
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
            
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
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
