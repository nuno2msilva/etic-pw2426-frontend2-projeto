/**
 * use-mobile.tsx
 * ---------------------------------------------------------------------------
 * Custom hook that detects whether the viewport is at or below a mobile
 * breakpoint (768 px by default). Uses `window.matchMedia` to listen for
 * viewport changes and updates state reactively.
 *
 * Returns:
 * @returns {boolean} `true` when the viewport width is < 768 px.
 *
 * Usage:
 * ```tsx
 * const isMobile = useIsMobile();
 * ```
 *
 * Used by: shadcn/ui sidebar, responsive layout decisions.
 * ---------------------------------------------------------------------------
 */

import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
