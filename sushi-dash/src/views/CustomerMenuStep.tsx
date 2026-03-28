"use client";

import { useOrderingFlow } from "@/hooks/useOrderingFlow";
import MenuOrderingView from "@/components/app/MenuOrderingView";
import type { Table } from "@/types/models";

interface CustomerMenuStepProps {
  table: Table;
}

export default function CustomerMenuStep({ table }: CustomerMenuStepProps) {
  const flow = useOrderingFlow(table);
  return <MenuOrderingView table={table} flow={flow} />;
}
