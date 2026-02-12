/**
 * CartSummaryBanner.tsx
 * ---------------------------------------------------------------------------
 * A cart summary banner that sticks below the header, and when the user
 * scrolls past it, it slides down with a smooth animation and
 * re-appears fixed at the bottom of the viewport. Scrolling back up
 * slides it back to the top. Height matches the category headers.
 *
 * Uses an IntersectionObserver on a sentinel element to detect when the
 * banner's natural position leaves the viewport.
 * ---------------------------------------------------------------------------
 */

import { ChevronRight } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import CardPanel from "./CardPanel";

interface CartSummaryBannerProps {
  summary: string;
  onReview?: () => void;
}

const CartSummaryBanner = ({ summary, onReview }: CartSummaryBannerProps) => {
  const hasItems = summary && summary.trim() !== "";
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'stretching' | 'moved'>('idle');

  // Observe when the sentinel (banner's original position) leaves the viewport
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const scrollingDown = !entry.isIntersecting;

        if (scrollingDown && !isAtBottom) {
          // Unstick: stretch first, then move to bottom
          setPhase('stretching');
          setTimeout(() => {
            setIsAtBottom(true);
            setPhase('moved');
            setTimeout(() => setPhase('idle'), 500);
          }, 200);
        } else if (!scrollingDown && isAtBottom) {
          // Re-stick: animate back up
          setPhase('stretching');
          setTimeout(() => {
            setIsAtBottom(false);
            setPhase('moved');
            setTimeout(() => setPhase('idle'), 500);
          }, 200);
        }
      },
      {
        // Trigger when sentinel passes below the header area
        rootMargin: '-80px 0px 0px 0px',
        threshold: 0,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isAtBottom]);

  return (
    <>
      {/* Sentinel — invisible marker at the banner's natural position */}
      <div ref={sentinelRef} className="h-0 w-full" aria-hidden="true" />

      {/* Positioning wrapper — handles fixed/sticky without transforms so
           animation can use translateY freely without conflicting with centering */}
      <div
        className={
          isAtBottom
            ? 'fixed bottom-3 left-0 right-0 z-40 flex justify-center px-4'
            : 'sticky top-[4.3rem] z-40'
        }
      >
        {/* The actual banner */}
        <CardPanel
          className={[
            // Override bg for banner-specific look
            'bg-secondary/95 backdrop-blur-sm text-foreground w-full max-w-5xl',
            isAtBottom ? 'shadow-2xl' : 'shadow-sm',
            // Animation — vertical slide only
            phase === 'stretching'
              ? 'transition-[transform,opacity] duration-200 ease-in translate-y-4 opacity-80'
              : phase === 'moved'
                ? 'transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] translate-y-0 opacity-100'
                : '',
          ].join(' ')}
        >
        <div className="flex items-center justify-between w-full h-7">
          <div className="flex items-center gap-3 flex-1 mr-3 min-w-0">
            <span className="text-lg font-semibold shrink-0 leading-none">🛒 Your picks:</span>
            {summary ? (
              <span className="text-sm text-muted-foreground truncate">{summary}</span>
            ) : (
              <span className="text-sm text-muted-foreground italic shrink-0">
                Currently empty, start picking!
              </span>
            )}
          </div>

          {/* GO button — always reserves w-8 space to prevent height shift */}
          <div className="flex-shrink-0 w-8 h-7 flex items-center justify-center">
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
      </CardPanel>
      </div>

      {/* Placeholder to prevent layout shift when banner goes fixed —
           same p-4 + text-lg + border-2 as the banner to match its natural height */}
      {isAtBottom && (
        <CardPanel className="border-transparent" aria-hidden="true">
          <span className="text-lg invisible">placeholder</span>
        </CardPanel>
      )}

      {/* Gap below banner — matches category spacing (space-y-3 = 0.75rem) */}
      <div className="h-3" aria-hidden="true" />
    </>
  );
};

export default CartSummaryBanner;
