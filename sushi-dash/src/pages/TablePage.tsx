/**
 * ==========================================================================
 * TablePage — Customer ordering page for a specific table
 * ==========================================================================
 *
 * Route: /table/:tableId (accessed via QR code with ?pin= param)
 *
 * Uses the shared useOrderingFlow hook for cart, menu grouping, and
 * order submission. Only table-specific auth (QR PIN) lives here.
 * ==========================================================================
 */

import { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useOrderingFlow } from "@/hooks/useOrderingFlow";
import {
  MenuGrid,
  OrderConfirmation,
  CartSummaryBanner,
  CollapsibleSection,
  SEOHead,
  OrderProgressModal,
} from "@/components/app";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_EMOJI } from "@/types/models";

const TablePage = () => {
  const params = useParams<{ tableId: string }>();
  const tableId = params?.tableId;
  const searchParams = useSearchParams();
  const router = useRouter();

  const { menu, tables, orders, categories, settings, isLoading, cancelOrder } = useApp();
  const { loginAsCustomer, authenticatedTableId } = useAuth();

  // Track whether PIN auto-auth is in progress (prevents premature redirect)
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Find the table from the URL param
  const table = tables.find((t) => t.id === tableId);

  // Shared cart + ordering logic
  const flow = useOrderingFlow(table);

  // Auto-authenticate from QR code ?pin= param, then strip it from the URL
  useEffect(() => {
    const pin = searchParams.get("pin");
    if (pin && tableId) {
      setIsAuthenticating(true);
      loginAsCustomer(tableId, pin)
        .then((ok) => {
          if (ok) {
            toast.success("Welcome! 🍣");
            const url = new URL(window.location.href);
            url.searchParams.delete("pin");
            window.history.replaceState({}, "", url.pathname + url.search);
          }
        })
        .catch(() => {})
        .finally(() => setIsAuthenticating(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Loading state
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

  // Redirect if table not found or not authenticated
  if (!table || authenticatedTableId !== tableId) {
    router.replace("/");
    return null;
  }

  return (
    <main className="max-w-5xl mx-auto px-4 pt-8 pb-24">
      <SEOHead
        title={`${table.label} — Order`}
        description={`Browse and order from 100+ sushi items at ${table.label}. All-you-can-eat menu with real-time order tracking.`}
      />

      <div>
        {/* Header — title + orders counter */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-display font-bold text-foreground">
            {table.label} — Order
          </h1>

          <button
            onClick={() => flow.setShowProgress(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-secondary/80 transition-colors"
            aria-label="View order progress"
          >
            <span className="text-base">{!flow.tableOrderStatus.allowed ? "⚠️" : "📋"}</span>
            <span className={`text-sm font-bold ${!flow.tableOrderStatus.allowed ? "text-destructive" : "text-muted-foreground"}`}>
              {flow.tableOrders.length}/{settings.maxActiveOrdersPerTable}
            </span>
          </button>
        </div>

        {/* Cart Banner */}
        <CartSummaryBanner
          summary={flow.cartSummary}
          onReview={flow.totalItems > 0 ? () => flow.setShowConfirm(true) : undefined}
          onClear={flow.totalItems > 0 ? flow.handleClearCart : undefined}
          totalItems={flow.totalItems}
          maxItems={settings.maxItemsPerOrder}
        />

        {/* Menu by Category */}
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

      <OrderProgressModal
        open={flow.showProgress}
        onOpenChange={flow.setShowProgress}
        orders={flow.tableOrders}
        allOrders={orders}
        onCancelOrder={cancelOrder}
      />

      <OrderConfirmation
        open={flow.showConfirm}
        onOpenChange={flow.setShowConfirm}
        table={table}
        cart={flow.cart}
        menu={menu}
        onBack={flow.handleBackToMenu}
        onAddMore={flow.handleBackToMenu}
        onConfirm={flow.handlePlaceOrder}
        onIncrement={flow.handleIncrement}
        onDecrement={flow.handleDecrement}
        onRemove={flow.handleRemoveItem}
      />
    </main>
  );
};

export default TablePage;
