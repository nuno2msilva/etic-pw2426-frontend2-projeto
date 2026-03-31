// SEOHead — dynamically updates document.title and meta description via useEffect side-effects.

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
