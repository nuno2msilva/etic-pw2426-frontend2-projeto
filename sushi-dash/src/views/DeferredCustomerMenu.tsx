"use client";

import type { Table } from "@/types/models";
import { AppProvider } from "@/context/AppContext";
import QueryRuntimeProvider from "@/components/app/QueryRuntimeProvider";
import CustomerMenuStep from "@/views/CustomerMenuStep";

interface DeferredCustomerMenuProps {
  table: Table;
}

export default function DeferredCustomerMenu({ table }: DeferredCustomerMenuProps) {
  return (
    <QueryRuntimeProvider>
      <AppProvider>
        <CustomerMenuStep table={table} />
      </AppProvider>
    </QueryRuntimeProvider>
  );
}
