// RootLayout — HTML shell + metadata + provider tree wrapping every page.

import type { Metadata } from "next";
import "@/index.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Sushi Dash — All-You-Can-Eat Sushi Ordering System",
  description:
    "Sushi Dash is a modern all-you-can-eat sushi restaurant ordering system. Browse our menu of 100+ items, place orders from your table, and track them in real time.",
  keywords: [
    "sushi",
    "restaurant",
    "ordering",
    "all-you-can-eat",
    "Japanese food",
    "menu",
    "real-time orders",
  ],
  authors: [{ name: "Sushi Dash" }],
  robots: "index, follow",
  metadataBase: new URL("https://sushi-dash.vercel.app"),
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Sushi Dash",
    title: "Sushi Dash — All-You-Can-Eat Sushi Ordering",
    description:
      "Browse 100+ sushi items, place orders from your table, and track them in real time. A modern restaurant ordering experience.",
    url: "/",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sushi Dash — All-You-Can-Eat Sushi Ordering",
    description:
      "Browse 100+ sushi items, place orders from your table, and track them in real time.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🍣</text></svg>",
    apple:
      "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🍣</text></svg>",
  },
  other: {
    "theme-color": "#f97316",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Structured Data (JSON-LD) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
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
                hasMenuSection: [
                  { "@type": "MenuSection", name: "Nigiri", description: "Classic hand-pressed sushi" },
                  { "@type": "MenuSection", name: "Rolls", description: "Maki and specialty rolls" },
                  { "@type": "MenuSection", name: "Sashimi", description: "Fresh sliced fish" },
                  { "@type": "MenuSection", name: "Hot Dishes", description: "Teriyaki, tempura and more" },
                  { "@type": "MenuSection", name: "Sides", description: "Edamame, gyoza, salads" },
                  { "@type": "MenuSection", name: "Noodles", description: "Ramen, udon and more" },
                  { "@type": "MenuSection", name: "Drinks", description: "Tea, sake, sodas" },
                  { "@type": "MenuSection", name: "Desserts", description: "Mochi, ice cream, cakes" },
                ],
              },
              potentialAction: {
                "@type": "OrderAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: "https://sushi-dash.vercel.app/table/{tableId}",
                  actionPlatform: "http://schema.org/DesktopWebPlatform",
                },
                deliveryMethod:
                  "http://purl.org/goodrelations/v1#DeliveryModeOwnFleet",
              },
            }),
          }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
