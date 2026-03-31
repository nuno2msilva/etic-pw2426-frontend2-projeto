"use client";

import { useOrderingFlow } from "@/features/customer/hooks/useOrderingFlow";
import MenuOrderingView from "@/features/customer/components/MenuOrderingView";
import type { Table } from "@/features/shared/types/models";

interface CustomerMenuStepProps {
  table: Table;
}

export default function CustomerMenuStep({ table }: CustomerMenuStepProps) {
  const flow = useOrderingFlow(table);
  return <MenuOrderingView table={table} flow={flow} />;
}
