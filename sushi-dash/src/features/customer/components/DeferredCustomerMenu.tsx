"use client";

import type { Table } from "@/features/shared/types/models";
import { AppProvider } from "@/features/customer/context/AppContext";
import QueryRuntimeProvider from "@/features/shared/context/QueryRuntimeProvider";
import CustomerMenuStep from "@/features/customer/components/CustomerMenuStep";

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
