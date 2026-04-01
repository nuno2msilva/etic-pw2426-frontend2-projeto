'use client';

import Script from 'next/script';

/**
 * UmamiIntegration — Injects Umami analytics script into the page.
 * Place inside <body> in root layout (never inside <head>).
 *
 * auto-track is ENABLED (default): Umami patches history.pushState so every
 * Next.js App Router client-side navigation is tracked automatically — including
 * /table/1, /kitchen, /manager, etc. — with no manual page-view code.
 *
 * Custom events (pin_entered, order_placed, etc.) are sent via window.umami.track()
 * from analytics.ts.
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
      {...(excludeDomains.length > 0
        ? { 'data-exclude-domains': excludeDomains.join(',') }
        : {})}
      strategy="afterInteractive"
    />
  );
}

declare global {
  interface Window {
    umami?: {
      track: (
        eventOrPayload: string | { url?: string; referrer?: string },
        properties?: Record<string, string | number | boolean>
      ) => void;
    };
  }
}

export default UmamiIntegration;
