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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Typescript Interface for each item
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
    <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-5 gap-3">
      {items.map((item) => {
        const qty = cart[item.id] || 0;

        return (
          <div
            key={item.id}
            className={`relative rounded-xl border-2 bg-card p-3 min-h-[120px] transition-all hover:shadow-md ${
              qty > 0 ? "border-primary shadow-sm" : "border-border"
            }`}
          >
            {/* Item number in top-left corner with # prefix */}
            <div className="absolute top-2 left-2 text-xs font-bold text-muted-foreground z-10">
              #{item.name.match(/#(\d+)/)?.[1] || ''}
            </div>

            {/* HOT badge for popular items - top right */}
            {item.isPopular && (
              <Badge variant="orange" size="xs" className="absolute -top-2 -right-2 flex items-center gap-0.5 shadow-sm z-20">
                <Flame className="w-3 h-3" />
                HOT
              </Badge>
            )}

            {/* Minus button - closer on mobile, further on desktop */}
            <Button
              size="icon"
              variant={qty > 0 ? "destructive-soft" : "muted"}
              onClick={(e) => {
                e.stopPropagation();
                onDecrement(item);
              }}
              disabled={qty === 0}
              className={`rounded-full absolute left-2 md:left-4 lg:left-6 top-1/2 -translate-y-1/2 z-10 ${
                qty === 0 ? "cursor-not-allowed" : ""
              }`}
              aria-label={`Remove ${item.name}`}
            >
              <Minus className="w-5 h-5" />
            </Button>

            {/* Plus button - closer on mobile, further on desktop */}
            <Button
              size="icon"
              variant={canAddMore ? "soft" : "muted"}
              onClick={(e) => {
                e.stopPropagation();
                onIncrement(item);
              }}
              disabled={!canAddMore}
              className={`rounded-full absolute right-2 md:right-4 lg:right-6 top-1/2 -translate-y-1/2 z-10 ${
                !canAddMore ? "cursor-not-allowed" : ""
              }`}
              aria-label={`Add ${item.name}`}
            >
              <Plus className="w-5 h-5" />
            </Button>

            {/* Emoji centered in the middle of the card */}
            <div className="absolute inset-0 flex top-8 justify-center">
              <div className="relative">
                <span className="text-4xl block">{item.emoji}</span>
                {/* Quantity display on top-right of emoji */}
                {qty > 0 && (
                  <Badge size="xs" className="absolute -top-3 -right-5 shadow-md">
                    {qty}x
                  </Badge>
                )}
              </div>
            </div>

            {/* Item name at the bottom */}
            <div className="absolute bottom-2 left-2 right-2">
              <span className="text-sm font-medium text-card-foreground text-center leading-tight block">
                {item.name.replace(/#\d+\s/, '')}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SushiGrid;
