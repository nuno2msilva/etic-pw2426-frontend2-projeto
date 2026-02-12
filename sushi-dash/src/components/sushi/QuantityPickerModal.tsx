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
import IconButton from "./IconButton";
import ActionButton from "./ActionButton";

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
          <IconButton
            size="md"
            variant="outline"
            onClick={() => onQuantityChange(Math.max(0, quantity - 1))}
            className="text-lg"
          >
            −
          </IconButton>
          <span className="text-3xl font-bold text-foreground w-12 text-center">
            {quantity}
          </span>
          <IconButton
            size="md"
            variant="solid"
            onClick={() => onQuantityChange(quantity + 1)}
            className="text-lg"
          >
            +
          </IconButton>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <ActionButton
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="flex-1 border"
          >
            Cancel
          </ActionButton>
          <ActionButton
            variant="primary"
            size="sm"
            onClick={onConfirm}
            className="flex-1"
          >
            {quantity === 0 ? "Remove" : "Confirm"}
          </ActionButton>
        </div>
      </div>
    </div>
  );
};

export default QuantityPickerModal;
