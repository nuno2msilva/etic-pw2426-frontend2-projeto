/**
 * Table ordering page — Direct table access
 * Route: /table/:tableId
 */
"use client";

import { Suspense } from "react";
import TablePage from "@/views/TablePage";

export default function Page() {
  return (
    <Suspense>
      <TablePage />
    </Suspense>
  );
}
