/**
 * ==========================================================================
 * SEOHead — Dynamic document head manager for per-page SEO
 * ==========================================================================
 *
 * Updates the document <title> and <meta name="description"> on each
 * page navigation. This is the SPA equivalent of Next.js <Head>.
 *
 * Why not react-helmet?
 *   - Keeps the bundle small — we only need title + description.
 *   - Uses useEffect to update the DOM directly (standard pattern).
 *   - The static SEO tags in index.html handle crawlers & social previews.
 *
 * Usage:
 *   <SEOHead title="Kitchen Dashboard" description="Manage incoming orders" />
 *
 * ==========================================================================
 */

import { useEffect } from "react";

interface SEOHeadProps {
  /** Page title — appended to " | Sushi Dash" */
  title: string;
  /** Meta description for this page */
  description?: string;
}

export function SEOHead({ title, description }: SEOHeadProps) {
  useEffect(() => {
    // Update the document title with the brand suffix
    document.title = `${title} | Sushi Dash`;

    // Update the meta description tag if provided
    if (description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement("meta");
        metaDesc.setAttribute("name", "description");
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute("content", description);
    }
  }, [title, description]);

  // This component renders nothing — it only manages side effects
  return null;
}
