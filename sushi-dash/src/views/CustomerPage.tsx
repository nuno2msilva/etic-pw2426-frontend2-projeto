// CustomerPage — Landing page with table selection, PIN authentication, and menu ordering flow.

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { API_BASE } from "@/lib/config";

import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useOrderingFlow } from "@/hooks/useOrderingFlow";
import {
  TableSelector,
  MenuGrid,
  OrderConfirmation,
  CartSummaryBanner,
  CollapsibleSection,
  PinPad,
  StaffLoginModal,
  OrderProgressModal,
} from "@/components/app";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_EMOJI } from "@/types/models";
import type { Table } from "@/types/models";

type Step = "table" | "menu";

const CustomerPage = () => {
  const searchParams = useSearchParams();

  // Skip auto-restore when user explicitly navigated here (e.g. logo click)
  const skipAutoRestore = useRef(searchParams.get("select") === "true");

  const { menu, tables, orders, categories, settings, cancelOrder } = useApp();
  const { isInitialized, customerSession, loginAsCustomer, logout } = useAuth();

  const isCustomerAuthenticated = customerSession !== null;

  // ── Page-specific state ───────────────────────────────────────────────────
  const [step, setStep] = useState<Step>("table");
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [pendingTable, setPendingTable] = useState<Table | null>(null);
  const [showPinPad, setShowPinPad] = useState(false);
  const [showStaffLogin, setShowStaffLogin] = useState(false);

  // Derive the live table from the tables array so SSE name changes propagate
  const liveTable = selectedTable
    ? tables.find((t) => t.id === selectedTable.id) ?? selectedTable
    : null;

  // Shared cart + ordering logic
  const flow = useOrderingFlow(liveTable);

  // ── Session effects ───────────────────────────────────────────────────────

  // React to session being cleared (e.g. PIN changed by manager via SSE)
  useEffect(() => {
    if (isInitialized && !isCustomerAuthenticated && step !== "table") {
      setStep("table");
      setSelectedTable(null);
      flow.setCart({});
      flow.setOpenCategories(new Set());
    }
  }, [isInitialized, isCustomerAuthenticated, step]); // eslint-disable-line react-hooks/exhaustive-deps

  // Restore session on mount — verify with backend before auto-restoring
  useEffect(() => {
    if (skipAutoRestore.current) {
      skipAutoRestore.current = false;
      return;
    }
    if (isInitialized && isCustomerAuthenticated && customerSession?.tableId) {
      fetch(`${API_BASE}/api/auth/session`, { credentials: "include" })
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then(
          (data: {
            authenticated: boolean;
            role?: string;
            tableId?: number;
            sessions?: { role: string; tableId?: number | null; authenticated: boolean }[];
          }) => {
            const customerValid = data.sessions
              ? data.sessions.some(
                  (s) => s.role === "customer" && String(s.tableId) === customerSession.tableId,
                )
              : data.authenticated &&
                data.role === "customer" &&
                String(data.tableId) === customerSession.tableId;

            if (customerValid) {
              const table = tables.find((t) => t.id === customerSession.tableId);
              if (table) {
                setSelectedTable(table);
                setStep("menu");
              }
            } else {
              logout();
            }
          },
        )
        .catch(() => logout());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized]);

  // ── Table selection handlers ──────────────────────────────────────────────

  const handleSelectTable = (table: Table) => {
    if (isCustomerAuthenticated && customerSession?.tableId === table.id) {
      setSelectedTable(table);
      setStep("menu");
      return;
    }
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

  const handleBackToTables = () => {
    flow.setCart({});
    flow.setOpenCategories(new Set());
    setStep("table");
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="max-w-5xl mx-auto px-4 pt-8 pb-24">
      {/* Step 1: Table Selection */}
      {step === "table" && (
        <TableSelector
          tables={tables}
          onSelectTable={handleSelectTable}
          onStaffLogin={() => setShowStaffLogin(true)}
        />
      )}

      {/* Step 2: Menu + Cart */}
      {step === "menu" && liveTable && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-display font-bold text-foreground">
              {liveTable.label} — Order
            </h1>

            <button
              onClick={() => flow.setShowProgress(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-secondary/80 transition-colors"
              aria-label="View order progress"
            >
              <span className="text-base">
                {flow.tableOrders.length >= settings.maxActiveOrdersPerTable ? "⚠️" : "📋"}
              </span>
              <span
                className={`text-sm font-bold ${
                  flow.tableOrders.length >= settings.maxActiveOrdersPerTable
                    ? "text-destructive"
                    : "text-muted-foreground"
                }`}
              >
                {flow.tableOrders.length}/{settings.maxActiveOrdersPerTable}
              </span>
            </button>
          </div>

          <CartSummaryBanner
            summary={flow.cartSummary}
            onReview={flow.totalItems > 0 ? () => flow.setShowConfirm(true) : undefined}
            totalItems={flow.totalItems}
            maxItems={settings.maxItemsPerOrder}
          />

          <div className="space-y-3">
            {categories.map((category) => {
              const items = flow.menuByCategory[category] || [];
              const cartCount = flow.cartByCategory[category] || 0;
              const isOpen = flow.openCategories.has(category);
              if (items.length === 0) return null;

              return (
                <CollapsibleSection
                  key={category}
                  title={category}
                  icon={CATEGORY_EMOJI[category] || "📋"}
                  badge={cartCount > 0 ? <Badge size="sm">{cartCount} in cart</Badge> : undefined}
                  open={isOpen}
                  onToggle={() => flow.toggleCategory(category)}
                >
                  <MenuGrid
                    items={items}
                    cart={flow.cart}
                    maxItems={settings.maxItemsPerOrder}
                    currentTotal={flow.totalItems}
                    onIncrement={flow.handleIncrement}
                    onDecrement={flow.handleDecrement}
                  />
                </CollapsibleSection>
              );
            })}
          </div>
        </div>
      )}

      {/* Modals */}
      {liveTable && (
        <OrderConfirmation
          open={flow.showConfirm}
          onOpenChange={flow.setShowConfirm}
          table={liveTable}
          cart={flow.cart}
          menu={menu}
          onBack={flow.handleBackToMenu}
          onAddMore={flow.handleBackToMenu}
          onConfirm={flow.handlePlaceOrder}
          onIncrement={flow.handleIncrement}
          onDecrement={flow.handleDecrement}
          onRemove={flow.handleRemoveItem}
        />
      )}

      <PinPad
        isOpen={showPinPad}
        tableLabel={pendingTable?.label || "Table"}
        onSubmit={handlePinSubmit}
        onClose={() => {
          setShowPinPad(false);
          setPendingTable(null);
        }}
      />

      <OrderProgressModal
        open={flow.showProgress}
        onOpenChange={flow.setShowProgress}
        orders={flow.tableOrders}
        allOrders={orders}
        onCancelOrder={cancelOrder}
      />

      <StaffLoginModal isOpen={showStaffLogin} onClose={() => setShowStaffLogin(false)} />
    </main>
  );
};

export default CustomerPage;
