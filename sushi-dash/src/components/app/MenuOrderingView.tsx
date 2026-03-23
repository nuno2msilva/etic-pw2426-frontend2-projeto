// MenuOrderingView — Shared menu browsing + cart UI used by both CustomerPage and TablePage.
// Extracts the repeated category list, cart banner, and order modals into one reusable shell.

"use client";

import { useApp } from "@/context/AppContext";
import type { OrderingFlow } from "@/hooks/useOrderingFlow";
import {
  MenuGrid,
  OrderConfirmation,
  CartSummaryBanner,
  CollapsibleSection,
  OrderProgressModal,
} from "@/components/app";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_EMOJI } from "@/types/models";
import type { Table } from "@/types/models";

interface MenuOrderingViewProps {
  /** The table the customer is ordering from */
  table: Table;
  /** Ordering flow state (cart, categories, handlers) from useOrderingFlow */
  flow: OrderingFlow;
  /** Show a "clear cart" button in the banner */
  showClearCart?: boolean;
  /** Extra content rendered before the category list (e.g. SEOHead) */
  children?: React.ReactNode;
}

export default function MenuOrderingView({
  table,
  flow,
  showClearCart = false,
  children,
}: MenuOrderingViewProps) {
  const { menu, orders, categories, settings, cancelOrder } = useApp();

  // Whether the table has hit its active-order limit
  const atLimit = !flow.tableOrderStatus.allowed;

  return (
    <>
      <main className="h-full overflow-y-auto max-w-5xl mx-auto px-4 pt-8 pb-24">
        {children}

        {/* Header — table name + active-order counter */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-display font-bold text-foreground">
            {table.label} — Order
          </h1>

          <button
            onClick={() => flow.setShowProgress(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-secondary/80 transition-colors"
            aria-label="View order progress"
          >
            <span className="text-base">{atLimit ? "⚠️" : "📋"}</span>
            <span
              className={`text-sm font-bold ${
                atLimit ? "text-destructive" : "text-muted-foreground"
              }`}
            >
              {flow.tableOrders.length}/{settings.maxActiveOrdersPerTable}
            </span>
          </button>
        </div>

        {/* Sticky cart summary — docks top or bottom depending on scroll */}
        <CartSummaryBanner
          summary={flow.cartSummary}
          onReview={flow.totalItems > 0 ? () => flow.setShowConfirm(true) : undefined}
          onClear={showClearCart && flow.totalItems > 0 ? flow.handleClearCart : undefined}
          totalItems={flow.totalItems}
          maxItems={settings.maxItemsPerOrder}
        />

        {/* Category sections — collapsible groups of MenuGrid cards */}
        <div className="space-y-3">
          {categories.map((category) => {
            const items = flow.menuByCategory[category] || [];
            const cartCount = flow.cartByCategory[category] || 0;
            if (items.length === 0) return null;

            return (
              <CollapsibleSection
                key={category}
                title={category}
                icon={CATEGORY_EMOJI[category] || "📋"}
                badge={cartCount > 0 ? <Badge size="sm">{cartCount} in cart</Badge> : undefined}
                open={flow.openCategories.has(category)}
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
      </main>

      {/* Order review dialog */}
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

      {/* Active orders progress tracker */}
      <OrderProgressModal
        open={flow.showProgress}
        onOpenChange={flow.setShowProgress}
        orders={flow.tableOrders}
        allOrders={orders}
        onCancelOrder={cancelOrder}
      />
    </>
  );
}
