/**
 * Home page — Customer table selection & ordering
 * Route: /
 */
import { Suspense } from "react";
import type { Metadata } from "next";
import CustomerPage from "@/features/customer/components/CustomerPage";

const homeStructuredData = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: "Sushi Dash",
  description:
    "All-you-can-eat sushi restaurant with 100+ menu items and real-time ordering.",
  url: "https://sushi-dash.vercel.app/",
  image: "https://sushi-dash.vercel.app/og-image.png",
  servesCuisine: ["Japanese", "Sushi"],
  priceRange: "$$",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Lisbon",
    addressCountry: "PT",
  },
  hasMenu: {
    "@type": "Menu",
    name: "All-You-Can-Eat Menu",
    description:
      "100+ sushi items across Nigiri, Rolls, Sashimi, Hot Dishes, Sides, Noodles, Drinks and Desserts",
  },
};

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Sushi Dash | Table Selection & Ordering",
  description:
    "Select your table, unlock with PIN, and order from 145+ sushi items in real time.",
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeStructuredData) }}
      />
      <Suspense>
        <CustomerPage />
      </Suspense>
    </>
  );
}
