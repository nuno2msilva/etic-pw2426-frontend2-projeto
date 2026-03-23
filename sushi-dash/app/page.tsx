/**
 * Home page — Customer table selection & ordering
 * Route: /
 */
import { Suspense } from "react";
import type { Metadata } from "next";
import CustomerPage from "@/views/CustomerPage";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Sushi Dash | Table Selection & Ordering",
  description:
    "Select your table, unlock with PIN, and order from 145+ sushi items in real time.",
};

export default function Page() {
  return (
    <Suspense>
      <CustomerPage />
    </Suspense>
  );
}
