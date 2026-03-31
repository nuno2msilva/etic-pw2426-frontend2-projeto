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
      <Suspense
        fallback={
          <HomeHeroSkeleton />
        }
      >
        <CustomerPage />
      </Suspense>
    </>
  );
}

/** SSR skeleton matching the real TableSelector layout so LCP text is in the initial HTML. */
function HomeHeroSkeleton() {
  return (
    <main aria-label="Table selection" className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-start px-4 pt-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center">
            <p className="type-body-muted">
              All-you-can-eat! Select your table to start ordering.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              className="rounded-xl border bg-card p-6 text-center animate-pulse"
            >
              <span className="text-3xl block mb-2 opacity-30">🪑</span>
              <span className="inline-block h-4 w-16 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
