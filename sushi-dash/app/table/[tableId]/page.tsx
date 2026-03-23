/**
 * Table ordering page — Direct table access
 * Route: /table/:tableId
 */
import { Suspense } from "react";
import type { Metadata } from "next";
import TablePage from "@/views/TablePage";

type TablePageProps = {
  params: Promise<{ tableId: string }>;
};

export async function generateMetadata({ params }: TablePageProps): Promise<Metadata> {
  const { tableId } = await params;
  return {
    title: `Table ${tableId} Ordering | Sushi Dash`,
    description: `Order sushi directly for table ${tableId}.`,
  };
}

export default function Page() {
  return (
    <Suspense>
      <TablePage />
    </Suspense>
  );
}
