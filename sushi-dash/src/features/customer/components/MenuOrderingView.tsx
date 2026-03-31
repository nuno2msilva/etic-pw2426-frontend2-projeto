// MenuOrderingView — Shared menu browsing + cart UI used by both CustomerPage and TablePage.
// Extracts the repeated category list, cart banner, and order modals into one reusable shell.

"use client";

import { useApp } from "@/features/customer/context/AppContext";
import type { OrderingFlow } from "@/features/customer/hooks/useOrderingFlow";
import { MenuGrid, OrderConfirmation, CartSummaryBanner, CollapsibleSection, OrderProgressModal } from "@/features/customer";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_EMOJI } from "@/features/shared/types/models";
import type { Table } from "@/features/shared/types/models";

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
      <main className="page-shell page-shell-roomy flex flex-col">
        {children}

        {/* Header — title on left, orders button on right, same line, matching height */}
        <div className="flex flex-row items-center justify-between gap-3 mb-3 sm:mb-4">
          <h1 className="type-display shrink-0">
            {table.label}
          </h1>
          <button
            onClick={() => flow.setShowProgress(true)}
            className="inline-flex items-center justify-center gap-1 rounded-lg border border-border bg-card px-2 py-2 sm:py-2.5 text-[10px] sm:text-xs shadow-sm hover:shadow-md hover:border-primary/40 hover:bg-accent/40 transition-all duration-200 active:scale-[0.98] whitespace-nowrap shrink-0 h-[2.5rem] sm:h-auto"
            aria-label="View order progress"
          >
            <span className="text-xs sm:text-sm leading-none" aria-hidden="true">{atLimit ? "⚠️" : "📋"}</span>
            <span className="uppercase tracking-wide font-semibold text-muted-foreground">
              Orders
            </span>
            <span
              className={`font-bold text-[10px] sm:text-xs ${
                atLimit ? "text-destructive" : "text-muted-foreground"
              }`}
            >
              {flow.tableOrders.length}/{settings.maxActiveOrdersPerTable}
            </span>
          </button>
        </div>

        {/* Only menu categories/items scroll; cart area stays reserved at bottom */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 mobile-scroll-area">
          <div className="space-y-3 pb-4">
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
        </div>

        <div className="shrink-0 mt-2 border-t border-border/70 bg-background/95 px-1 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.25rem)] sm:pb-1">
          <CartSummaryBanner
            summary={flow.cartSummary}
            onReview={flow.totalItems > 0 ? () => flow.setShowConfirm(true) : undefined}
            onClear={showClearCart && flow.totalItems > 0 ? flow.handleClearCart : undefined}
            totalItems={flow.totalItems}
            maxItems={settings.maxItemsPerOrder}
            useFloatingDock={false}
          />
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
