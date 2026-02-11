/**
 * ==========================================================================
 * OrderConfirmation — Review and send order to kitchen
 * ==========================================================================
 *
 * The final step before submitting an order. Shows:
 *   - All items in the cart with emoji, name, and quantity
 *   - "Add More" button to return to the menu
 *   - "Send to Kitchen 🚀" button to confirm the order
 *
 * This component does not manage any state itself — it receives
 * all data and callbacks via props (pure presentational).
 *
 * Props:
 *   table    — The current table
 *   cart     — Cart state (Record<itemId, quantity>)
 *   menu     — Full menu array (to resolve item IDs to names)
 *   onBack   — Navigate back to menu
 *   onAddMore — Navigate back to menu (alias)
 *   onConfirm — Submit the order
 *
 * ==========================================================================
 */

import type { SushiItem, Table } from "@/types/sushi";

interface OrderConfirmationProps {
  table: Table;
  cart: Record<string, number>;
  menu: SushiItem[];
  onBack: () => void;
  onAddMore: () => void;
  onConfirm: () => void;
}

const OrderConfirmation = ({
  table,
  cart,
  menu,
  onBack,
  onAddMore,
  onConfirm,
}: OrderConfirmationProps) => {
  return (
    <div className="max-w-lg mx-auto">
      <button
        onClick={onBack}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        ← Back to menu
      </button>

      <h1 className="text-2xl font-display font-bold text-foreground mb-2">
        Confirm Order — {table.label}
      </h1>

      {/* Order Items */}
      <div className="rounded-xl border bg-card p-4 mb-6">
        {Object.entries(cart).map(([id, qty]) => {
          const item = menu.find((m) => m.id === id);
          if (!item) return null;

          return (
            <div
              key={id}
              className="flex items-center justify-between py-2 border-b last:border-0"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{item.emoji}</span>
                <span className="font-medium text-card-foreground">{item.name}</span>
              </div>
              <span className="font-bold text-foreground">{qty}x</span>
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onAddMore}
          className="flex-1 py-3 rounded-xl border border-border text-muted-foreground hover:text-foreground font-medium transition-colors"
        >
          Add More
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition-opacity"
        >
          Send to Kitchen 🚀
        </button>
      </div>
    </div>
  );
};

export default OrderConfirmation;
