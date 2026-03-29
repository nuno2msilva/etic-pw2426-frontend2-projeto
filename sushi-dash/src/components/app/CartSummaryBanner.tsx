// CartSummaryBanner — sticky cart bar that auto-docks to top or bottom with IntersectionObserver scroll detection.

import { ChevronRight, Trash2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";

interface CartSummaryBannerProps {
  summary: string;
  onReview?: () => void;
  /** Callback to clear the entire cart */
  onClear?: () => void;
  /** Current number of items in the cart */
  totalItems?: number;
  /** Maximum items allowed per order */
  maxItems?: number;
  /** Use animated floating dock behavior (legacy). Disable for reserved bottom layout. */
  useFloatingDock?: boolean;
}

const CartSummaryBanner = ({
  summary,
  onReview,
  onClear,
  totalItems = 0,
  maxItems = 0,
  useFloatingDock = true,
}: CartSummaryBannerProps) => {
  const hasItems = summary && summary.trim() !== "";
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'stretching' | 'moved'>('idle');

  // Observe when the sentinel (banner's original position) leaves the viewport
  useEffect(() => {
    if (!useFloatingDock) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const scrollingDown = !entry.isIntersecting;

        if (scrollingDown && !isAtBottom) {
          setPhase('stretching');
          setTimeout(() => {
            setIsAtBottom(true);
            setPhase('moved');
            setTimeout(() => setPhase('idle'), 500);
          }, 200);
        } else if (!scrollingDown && isAtBottom) {
          setPhase('stretching');
          setTimeout(() => {
            setIsAtBottom(false);
            setPhase('moved');
            setTimeout(() => setPhase('idle'), 500);
          }, 200);
        }
      },
      {
        rootMargin: '-80px 0px 0px 0px',
        threshold: 0,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isAtBottom, useFloatingDock]);

  const cardContent = (
    <Card
      variant="item"
      className={[
        'bg-secondary/95 backdrop-blur-sm text-foreground w-full',
        isAtBottom ? 'shadow-2xl' : 'shadow-sm',
        phase === 'stretching'
          ? 'transition-[transform,opacity] duration-200 ease-in translate-y-4 opacity-80'
          : phase === 'moved'
            ? 'transition-[transform,opacity] duration-500 ease-&lsqb;cubic-bezier(0.34,1.56,0.64,1)&rsqb; translate-y-0 opacity-100'
            : '',
      ].join(' ')}
    >
      <div className="flex items-center justify-between w-full h-7">
        {/* Left: cart icon + summary */}
        <div className="flex items-center gap-2 flex-1 mr-2 min-w-0">
          <span className="text-base font-semibold shrink-0 leading-none">🛒</span>
          {summary ? (
            <span className="text-xs text-muted-foreground truncate">{summary}</span>
          ) : (
            <span className="text-xs text-muted-foreground italic shrink-0">
              Start picking!
            </span>
          )}
        </div>

        {/* Right: items counter + clear + GO button */}
        <div className="flex items-center gap-2 shrink-0">
          {maxItems > 0 && (
            <span className={`text-sm font-bold ${totalItems >= maxItems ? "text-destructive" : "text-muted-foreground"}`}>
              {totalItems}/{maxItems}
            </span>
          )}

          {/* Clear cart button */}
          {hasItems && onClear && (
            <button
              onClick={onClear}
              className="w-7 h-7 rounded-full bg-muted text-muted-foreground flex items-center justify-center hover:bg-destructive/20 hover:text-destructive transition-colors"
              aria-label="Clear cart"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="w-7 h-7 flex items-center justify-center">
            {hasItems && onReview && (
              <button
                onClick={onReview}
                className="w-7 h-7 rounded-full bg-destructive text-destructive-foreground flex flex-col items-center justify-center hover:bg-destructive/90 transition-colors"
                aria-label="Review order"
              >
                <ChevronRight className="w-4 h-4 -mb-1" />
                <span className="text-[8px] font-bold leading-none">GO</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );

  if (!useFloatingDock) {
    return cardContent;
  }

  return (
    <>
      {/* Sentinel — invisible marker at the banner's natural position */}
      <div ref={sentinelRef} className="h-0 w-full" aria-hidden="true" />

      <div
        className={
          isAtBottom
            ? 'fixed bottom-3 left-0 right-0 z-40 max-w-5xl mx-auto px-4 pb-[env(safe-area-inset-bottom)]'
            : 'sticky top-[4.3rem] z-40'
        }
      >
        {cardContent}
      </div>

      {isAtBottom && (
        <Card variant="item" className="border-transparent" aria-hidden="true">
          <span className="text-lg invisible">placeholder</span>
        </Card>
      )}

      <div className="h-3" aria-hidden="true" />
    </>
  );
};

export default CartSummaryBanner;
