'use client';

import Script from 'next/script';

/**
 * UmamiIntegration — Injects Umami analytics script into the page
 * This component should be placed in the root layout
 */

export interface UmamiIntegrationProps {
  trackingId: string;
  endpoint?: string;
  excludeDomains?: string[];
}

/**
 * Client-side component that injects the Umami tracking script
 * Add this to your root layout.tsx
 */
export function UmamiIntegration({
  trackingId,
  endpoint = 'https://analytics.umami.is',
  excludeDomains = [],
}: UmamiIntegrationProps) {
  if (!trackingId) {
    console.warn('[Umami] No tracking ID provided - analytics disabled');
    return null;
  }

  return (
    <Script
      src={`${endpoint}/script.js`}
      data-website-id={trackingId}
      data-exclude-domains={excludeDomains.join(',')}
      data-auto-track="true"
      strategy="lazyOnload"
      onLoad={() => {
        console.log('[Umami] Analytics script loaded successfully');
      }}
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
