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
      <head />
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
