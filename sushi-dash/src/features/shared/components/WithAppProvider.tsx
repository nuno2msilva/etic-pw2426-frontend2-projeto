"use client";

import { AppProvider } from "@/features/customer/context/AppContext";

export default function WithAppProvider({ children }: { children: React.ReactNode }) {
  return <AppProvider>{children}</AppProvider>;
}
