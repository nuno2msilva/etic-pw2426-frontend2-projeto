// OrderConfirmation — review/edit cart before sending to kitchen, with +/- and trash controls.

import { useState } from "react";
import { Plus, Minus, Trash2, Check, X } from "lucide-react";
import type { MenuItem, Table } from "@/features/shared/types/models";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface OrderConfirmationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: Table;
  cart: Record<string, number>;
  menu: MenuItem[];
  onBack: () => void;
  onAddMore: () => void;
  onConfirm: () => void;
  onIncrement: (item: MenuItem) => void;
  onDecrement: (item: MenuItem) => void;
  onRemove: (item: MenuItem) => void;
}

const OrderConfirmation = ({
  open,
  onOpenChange,
  table,
  cart,
  menu,
  onBack,
  onAddMore,
  onConfirm,
  onIncrement,
  onDecrement,
  onRemove,
}: OrderConfirmationProps) => {
  const totalItems = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  // Track which item is pending deletion confirmation
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Decrement qty — if it would drop to 0, prompt for removal confirmation instead
  const handleDecrement = (item: MenuItem, qty: number) => {
    if (qty <= 1) {
      setPendingDeleteId(item.id);
    } else {
      onDecrement(item);
    }
  };

  const confirmDelete = (item: MenuItem) => {
    onRemove(item);
    setPendingDeleteId(null);
  };

  const cancelDelete = () => {
    setPendingDeleteId(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-lg sm:max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">Confirm Order — {table.label}</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">Review your items before placing the order.</DialogDescription>
        </DialogHeader>

      {totalItems === 0 ? (
        <div className="p-6 text-center">
          <span className="text-4xl mb-3 block">🍣</span>
          <p className="text-muted-foreground">Your cart is empty.</p>
          <Button
            variant="default"
            size="lg"
            onClick={onAddMore}
            className="mt-4"
          >
            Browse Menu
          </Button>
        </div>
      ) : (
        <>
          {/* Item cards — scrollable list */}
          <div className="space-y-3 overflow-y-auto max-h-[50vh] pr-1">
            {Object.entries(cart).map(([id, qty]) => {
              const item = menu.find((m) => m.id === id);
              if (!item) return null;

              const isPendingDelete = pendingDeleteId === id;

              return (
                <Card
                  key={id}
                  variant="item"
                  className={`w-full flex items-center justify-between ${
                    isPendingDelete
                      ? 'bg-destructive/5 border-destructive/50'
                      : ''
                  }`}
                >
                  {/* Left: emoji with qty badge + name */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative shrink-0">
                      <span className="text-base sm:text-lg">{item.emoji}</span>
                      <Badge size="xs" className="absolute -top-2 -right-4 shadow-sm">
                        {qty}x
                      </Badge>
                    </div>
                    <span className="text-sm sm:text-lg font-semibold truncate">
                      {item.name}
                    </span>
                  </div>

                  {/* Right: controls */}
                  <div className="flex items-center shrink-0 ml-3">
                    {isPendingDelete ? (
                      /* Confirmation buttons */
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-destructive font-medium mr-1">Remove?</span>
                        <Button
                          variant="destructive"
                          size="icon-sm"
                          className="rounded-full"
                          onClick={() => confirmDelete(item)}
                          aria-label="Confirm remove"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="muted"
                          size="icon-sm"
                          className="rounded-full"
                          onClick={cancelDelete}
                          aria-label="Cancel remove"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      /* Normal controls: trash · gap · minus · plus */
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost-destructive"
                          size="icon-sm"
                          className="rounded-full"
                          onClick={() => setPendingDeleteId(id)}
                          aria-label={`Remove ${item.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>

                        <div className="w-3" />

                        <Button
                          variant="destructive-soft"
                          size="icon-sm"
                          className="rounded-full"
                          onClick={() => handleDecrement(item, qty)}
                          aria-label={`Decrease ${item.name}`}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="soft"
                          size="icon-sm"
                          className="rounded-full"
                          onClick={() => onIncrement(item)}
                          aria-label={`Increase ${item.name}`}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Action Buttons — responsive layout */}
          <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="lg"
              onClick={onAddMore}
              className="flex-1 text-xs sm:text-base"
            >
              Add More
            </Button>
            <Button
              size="lg"
              onClick={onConfirm}
              className="flex-1 text-xs sm:text-base"
            >
              Order Now 🚀
            </Button>
          </div>
        </>
      )}
      </DialogContent>
    </Dialog>
  );
};

export default OrderConfirmation;
