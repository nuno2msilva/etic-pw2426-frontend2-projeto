'use client';

import Script from 'next/script';
import { flushAnalyticsQueue } from '../lib/analytics';

/**
 * UmamiIntegration — Injects Umami analytics script into the page.
 * Place in root layout inside <body>.
 * - auto-track is disabled: we manually track page views via usePageTracking
 *   so routes like /table/1 are always captured without double-counting.
 * - onLoad flushes any events that fired before the script finished downloading.
 */

export interface UmamiIntegrationProps {
  trackingId: string;
  endpoint?: string;
  excludeDomains?: string[];
}

export function UmamiIntegration({
  trackingId,
  endpoint = 'https://analytics.umami.is',
  excludeDomains = [],
}: UmamiIntegrationProps) {
  if (!trackingId) return null;

  return (
    <Script
      src={`${endpoint}/script.js`}
      data-website-id={trackingId}
      data-auto-track="false"
      data-exclude-domains={excludeDomains.join(',')}
      strategy="afterInteractive"
      onLoad={flushAnalyticsQueue}
    />
  );
}

/**
 * Declare the global umami object for TypeScript
 */
declare global {
  interface Window {
    umami?: {
      track: (event: string, properties?: Record<string, string | number | boolean>) => void;
      trackView: (
        url?: string,
        referrer?: string,
        properties?: Record<string, string | number | boolean>
      ) => void;
      api: (endpoint: string, body: unknown) => Promise<unknown>;
    };
  }
}

export default UmamiIntegration;
