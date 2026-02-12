/**
 * ==========================================================================
 * OrderConfirmation — Review and edit order before sending to kitchen
 * ==========================================================================
 *
 * Each cart item is displayed as a card matching the category header style
 * (p-4 rounded-xl border-2). Users can adjust quantity with +/- buttons
 * or remove items via trash. Deleting an item (trash or reducing to 0)
 * requires a confirmation tap.
 *
 * Props:
 *   table       — The current table
 *   cart        — Cart state (Record<itemId, quantity>)
 *   menu        — Full menu array (to resolve item IDs to names)
 *   onBack      — Navigate back to menu
 *   onAddMore   — Navigate back to menu (alias)
 *   onConfirm   — Submit the order
 *   onIncrement — Add one more of an item
 *   onDecrement — Remove one of an item
 *   onRemove    — Remove an item entirely from the cart
 *
 * ==========================================================================
 */

import { useState } from "react";
import { Plus, Minus, Trash2, Check, X } from "lucide-react";
import type { SushiItem, Table } from "@/types/sushi";
import CardPanel from "./CardPanel";
import IconButton from "./IconButton";
import Badge from "./Badge";
import ActionButton from "./ActionButton";

interface OrderConfirmationProps {
  table: Table;
  cart: Record<string, number>;
  menu: SushiItem[];
  onBack: () => void;
  onAddMore: () => void;
  onConfirm: () => void;
  onIncrement: (item: SushiItem) => void;
  onDecrement: (item: SushiItem) => void;
  onRemove: (item: SushiItem) => void;
}

const OrderConfirmation = ({
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

  /** Track which item is pending deletion confirmation */
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  /** Handle decrement — if qty would reach 0, ask for confirmation instead */
  const handleDecrement = (item: SushiItem, qty: number) => {
    if (qty <= 1) {
      setPendingDeleteId(item.id);
    } else {
      onDecrement(item);
    }
  };

  /** Confirm deletion */
  const confirmDelete = (item: SushiItem) => {
    onRemove(item);
    setPendingDeleteId(null);
  };

  /** Cancel deletion */
  const cancelDelete = () => {
    setPendingDeleteId(null);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={onBack}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        ← Back to menu
      </button>

      <h1 className="text-2xl font-display font-bold text-foreground mb-4">
        Confirm Order — {table.label}
      </h1>

      {totalItems === 0 ? (
        <CardPanel className="p-8 text-center">
          <span className="text-4xl mb-3 block">🍣</span>
          <p className="text-muted-foreground">Your cart is empty.</p>
          <ActionButton
            variant="primary"
            size="md"
            onClick={onAddMore}
            className="mt-4"
          >
            Browse Menu
          </ActionButton>
        </CardPanel>
      ) : (
        <>
          {/* Item cards — same style as category headers */}
          <div className="space-y-3 mb-6">
            {Object.entries(cart).map(([id, qty]) => {
              const item = menu.find((m) => m.id === id);
              if (!item) return null;

              const isPendingDelete = pendingDeleteId === id;

              return (
                <CardPanel
                  key={id}
                  className={`w-full flex items-center justify-between ${
                    isPendingDelete
                      ? 'bg-destructive/5 border-destructive/50'
                      : ''
                  }`}
                >
                  {/* Left: emoji with qty badge + name */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative shrink-0">
                      <span className="text-lg">{item.emoji}</span>
                      <Badge size="xs" className="absolute -top-2 -right-4 shadow-sm">
                        {qty}x
                      </Badge>
                    </div>
                    <span className="text-lg font-semibold truncate">
                      {item.name}
                    </span>
                  </div>

                  {/* Right: controls */}
                  <div className="flex items-center shrink-0 ml-3">
                    {isPendingDelete ? (
                      /* Confirmation buttons */
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-destructive font-medium mr-1">Remove?</span>
                        <IconButton
                          variant="solid-danger"
                          onClick={() => confirmDelete(item)}
                          aria-label="Confirm remove"
                        >
                          <Check className="w-4 h-4" />
                        </IconButton>
                        <IconButton
                          variant="muted"
                          onClick={cancelDelete}
                          aria-label="Cancel remove"
                        >
                          <X className="w-4 h-4" />
                        </IconButton>
                      </div>
                    ) : (
                      /* Normal controls: trash · gap · minus · plus */
                      <div className="flex items-center gap-1">
                        <IconButton
                          variant="ghost"
                          onClick={() => setPendingDeleteId(id)}
                          aria-label={`Remove ${item.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </IconButton>

                        <div className="w-3" />

                        <IconButton
                          variant="destructive"
                          onClick={() => handleDecrement(item, qty)}
                          aria-label={`Decrease ${item.name}`}
                        >
                          <Minus className="w-4 h-4" />
                        </IconButton>

                        <IconButton
                          variant="primary"
                          onClick={() => onIncrement(item)}
                          aria-label={`Increase ${item.name}`}
                        >
                          <Plus className="w-4 h-4" />
                        </IconButton>
                      </div>
                    )}
                  </div>
                </CardPanel>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <ActionButton
              variant="outline"
              size="md"
              onClick={onAddMore}
              className="flex-1"
            >
              Add More
            </ActionButton>
            <ActionButton
              variant="primary"
              size="md"
              onClick={onConfirm}
              className="flex-1"
            >
              Send to Kitchen 🚀
            </ActionButton>
          </div>
        </>
      )}
    </div>
  );
};

export default OrderConfirmation;
