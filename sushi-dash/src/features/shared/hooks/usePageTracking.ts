/**
 * usePageTracking — Tracks page views on every route change.
 * Handles SPA navigation in Next.js App Router (no page reload).
 * Add to root layout to enable site-wide page tracking.
 */

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackPageView } from '../lib/analytics';

export function usePageTracking() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname) {
      trackPageView(pathname, document.referrer);
    }
  }, [pathname]);
}
