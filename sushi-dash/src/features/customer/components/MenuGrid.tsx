// MenuGrid — responsive grid of menu items with +/- quantity controls and HOT badges.

import { Plus, Minus, Flame } from "lucide-react";
import type { MenuItem } from "@/features/shared/types/models";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface MenuGridProps {
  items: MenuItem[];
  cart: Record<string, number>;
  maxItems: number;
  currentTotal: number;
  onIncrement: (item: MenuItem) => void;
  onDecrement: (item: MenuItem) => void;
}

const MenuGrid = ({ 
  items, 
  cart, 
  maxItems,
  currentTotal,
  onIncrement, 
  onDecrement, 
}: MenuGridProps) => {
  const canAddMore = currentTotal < maxItems;
  const stripNumberPrefix = (name: string) => name.replace(/^#\d+\s+/, "");

  return (
    <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-5 gap-3">
      {items.map((item) => {
        const qty = cart[item.id] || 0;
        const available = item.isAvailable !== false;

        return (
          <div
            key={item.id}
            className={`relative rounded-xl border-2 bg-card p-3 min-h-[120px] transition-all duration-200 hover:shadow-md ${
              !available
                ? "border-border opacity-50 grayscale"
                : qty > 0 ? "border-primary shadow-sm" : "border-border"
            }`}
          >
            {/* Item number in top-left corner with # prefix */}
            <div className="absolute top-2 left-2 text-xs font-bold text-muted-foreground z-10">
              #{item.id}
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
              disabled={qty === 0 || !available}
              className={`rounded-full absolute left-2 md:left-4 lg:left-6 top-1/2 -translate-y-1/2 z-10 ${
                qty === 0 || !available ? "cursor-not-allowed" : ""
              }`}
              aria-label={`Remove ${item.name}`}
            >
              <Minus className="w-5 h-5" />
            </Button>

            {/* Plus button - closer on mobile, further on desktop */}
            <Button
              size="icon"
              variant={canAddMore && available ? "soft" : "muted"}
              onClick={(e) => {
                e.stopPropagation();
                onIncrement(item);
              }}
              disabled={!canAddMore || !available}
              className={`rounded-full absolute right-2 md:right-4 lg:right-6 top-1/2 -translate-y-1/2 z-10 ${
                !canAddMore || !available ? "cursor-not-allowed" : ""
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
                {stripNumberPrefix(item.name)}
              </span>
              {!available && (
                <span className="text-[10px] font-bold text-destructive text-center block mt-0.5">
                  Unavailable
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MenuGrid;
