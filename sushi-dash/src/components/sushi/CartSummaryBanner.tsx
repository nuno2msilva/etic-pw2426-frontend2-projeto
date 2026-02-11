/**
 * CartSummaryBanner.tsx
 * ---------------------------------------------------------------------------
 * A sticky banner that displays the customer's current cart contents as a
 * human-readable summary string (e.g. "Salmon Nigiri (2x), Tuna Roll (1x)").
 *
 * Behaviour:
 * - Always visible, even when cart is empty (shows "Empty!" placeholder).
 * - Sticks below the AppHeader (top-16 → 4rem) using `position: sticky`
 *   so it's always visible while scrolling the menu.
 * - Uses backdrop blur + slight transparency for a glass-morphism effect.
 * - Prevents layout shift when adding/removing items from cart.
 *
 * Props:
 * @prop {string} summary — Formatted string of all cart items with quantities.
 *
 * Used in: TablePage (menu step)
 * ---------------------------------------------------------------------------
 */

interface CartSummaryBannerProps {
  summary: string;
}

/**
 * Sticky cart summary showing current selections.
 * Sticks below the header when scrolling.
 * Always visible to prevent layout shifts.
 */
const CartSummaryBanner = ({ summary }: CartSummaryBannerProps) => {
  return (
    <div className="sticky top-16 z-40 rounded-xl border bg-secondary/95 backdrop-blur-sm px-4 py-3 mb-6 text-sm text-foreground shadow-sm">
      <span className="font-bold">🛒 Your picks: </span>
      {summary || <span className="text-muted-foreground italic">Empty!</span>}
    </div>
  );
};

export default CartSummaryBanner;
