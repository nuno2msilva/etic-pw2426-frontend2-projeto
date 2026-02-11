/**
 * QuantityPickerModal.tsx
 * ---------------------------------------------------------------------------
 * Full-screen overlay modal for selecting the quantity of a specific sushi
 * item before adding it to the cart. Appears when the customer taps an item
 * card in the SushiGrid.
 *
 * UI:
 * - Centered card with the item's emoji, name, and category.
 * - − / + buttons to adjust quantity, with a large numeric display.
 * - "Cancel" and "Add" action buttons.
 * - Backdrop blur with semi-transparent overlay; clicking the backdrop
 *   triggers `onCancel`.
 *
 * Props:
 * @prop {SushiItem} item             — The menu item being configured.
 * @prop {number}    quantity         — Current quantity value.
 * @prop {Function}  onQuantityChange — Called with the new quantity number.
 * @prop {Function}  onConfirm        — Called when the user clicks "Add".
 * @prop {Function}  onCancel         — Called when the user dismisses the modal.
 *
 * Used in: TablePage (when a sushi card is tapped)
 * ---------------------------------------------------------------------------
 */

import type { SushiItem } from "@/types/sushi";

interface QuantityPickerModalProps {
  item: SushiItem;
  quantity: number;
  onQuantityChange: (qty: number) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

const QuantityPickerModal = ({
  item,
  quantity,
  onQuantityChange,
  onConfirm,
  onCancel,
}: QuantityPickerModalProps) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="bg-card rounded-2xl p-6 shadow-2xl w-80"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Item Info */}
        <div className="text-center mb-4">
          <span className="text-5xl block mb-2">{item.emoji}</span>
          <h3 className="font-display text-lg font-bold text-card-foreground">
            {item.name}
          </h3>
          <p className="text-xs text-muted-foreground">{item.category}</p>
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <button
            onClick={() => onQuantityChange(Math.max(0, quantity - 1))}
            className="w-10 h-10 rounded-full border border-border text-foreground flex items-center justify-center hover:bg-secondary transition-colors text-lg"
          >
            −
          </button>
          <span className="text-3xl font-bold text-foreground w-12 text-center">
            {quantity}
          </span>
          <button
            onClick={() => onQuantityChange(quantity + 1)}
            className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-colors text-lg"
          >
            +
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground font-bold hover:opacity-90 transition-opacity text-sm"
          >
            {quantity === 0 ? "Remove" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuantityPickerModal;
