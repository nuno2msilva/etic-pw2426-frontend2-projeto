/**
 * Home page — Customer table selection & ordering
 * Route: /
 */
"use client";

import { Suspense } from "react";
import CustomerPage from "@/views/CustomerPage";

export default function Page() {
  return (
    <Suspense>
      <CustomerPage />
    </Suspense>
  );
}
