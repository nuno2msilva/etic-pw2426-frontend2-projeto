/**
 * usePageTracking — Automatically tracks page views and route changes
 * Hook for tracking analytics on every page navigation
 * Add to root layout to enable site-wide page tracking
 */

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackPageView } from '../lib/analytics';

export function usePageTracking() {
  const pathname = usePathname();

  useEffect(() => {
    // Track page view on every route change
    if (pathname) {
      // Map route to friendly page name for analytics
      const getPageName = (path: string): string => {
        if (path === '/') return 'Home';
        if (path.startsWith('/table/')) return 'Table Ordering';
        if (path === '/kitchen') return 'Kitchen Dashboard';
        if (path === '/manager') return 'Manager Panel';
        if (path === '/admin') return 'Admin Panel';
        return path.slice(1) || 'Home';
      };

      const pageName = getPageName(pathname);

      // Track the pageview with Umami
      trackPageView(pathname, document.referrer);
    }
  }, [pathname]);
}
