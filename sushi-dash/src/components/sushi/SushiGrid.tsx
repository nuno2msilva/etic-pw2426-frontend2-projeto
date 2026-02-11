/**
 * ==========================================================================
 * SushiGrid — Menu item display grid with quantity controls
 * ==========================================================================
 *
 * Renders a responsive grid of sushi menu items. Each item shows:
 *   - Emoji icon and name
 *   - +/- quantity buttons (only these change the cart)
 *   - "HOT" badge for popular items (isPopular flag)
 *   - Quantity badge when items are in the cart
 *
 * Clicking the item itself does nothing — only the explicit +/- buttons
 * modify the cart to prevent accidental taps on mobile.
 *
 * Props:
 *   items       — Array of SushiItem to display
 *   cart        — Current cart state (Record<itemId, quantity>)
 *   maxItems    — Maximum items allowed per order
 *   currentTotal — Current total items in cart (for limit enforcement)
 *   onIncrement — Callback when + is pressed
 *   onDecrement — Callback when − is pressed
 *
 * ==========================================================================
 */

import { Plus, Minus, Flame } from "lucide-react";
import type { SushiItem } from "@/types/sushi";

interface SushiGridProps {
  items: SushiItem[];
  cart: Record<string, number>;
  maxItems: number;
  currentTotal: number;
  onIncrement: (item: SushiItem) => void;
  onDecrement: (item: SushiItem) => void;
}

/**
 * Displays a grid of sushi menu items with +/- controls
 * - Shows "HOT" badge for popular items
 * - Only +/- buttons change quantity (clicking item does nothing)
 */
const SushiGrid = ({ 
  items, 
  cart, 
  maxItems,
  currentTotal,
  onIncrement, 
  onDecrement, 
}: SushiGridProps) => {
  const canAddMore = currentTotal < maxItems;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {items.map((item) => {
        const qty = cart[item.id] || 0;

        return (
          <div
            key={item.id}
            className={`relative rounded-xl border-2 bg-card p-3 transition-all hover:shadow-md ${
              qty > 0 ? "border-primary shadow-sm" : "border-border"
            }`}
          >
            {/* HOT badge for popular items */}
            {item.isPopular && (
              <span className="absolute -top-2 -left-2 px-1.5 py-0.5 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center gap-0.5 shadow-sm z-10">
                <Flame className="w-3 h-3" />
                HOT
              </span>
            )}

            {/* Item display - no click action */}
            <div className="w-full text-center mb-2">
              <span className="text-3xl block mb-1">{item.emoji}</span>
              <span className="text-xs font-medium text-card-foreground block leading-tight">
                {item.name}
              </span>
            </div>

            {/* Quick quantity controls */}
            <div className="flex items-center justify-center gap-2 mt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDecrement(item);
                }}
                disabled={qty === 0}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  qty > 0
                    ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
                aria-label={`Remove ${item.name}`}
              >
                <Minus className="w-4 h-4" />
              </button>

              <span className={`w-8 text-center font-bold text-sm ${
                qty > 0 ? "text-primary" : "text-muted-foreground"
              }`}>
                {qty}
              </span>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onIncrement(item);
                }}
                disabled={!canAddMore}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  canAddMore
                    ? "bg-primary/10 text-primary hover:bg-primary/20"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
                aria-label={`Add ${item.name}`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Quantity badge */}
            {qty > 0 && (
              <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                {qty}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SushiGrid;
