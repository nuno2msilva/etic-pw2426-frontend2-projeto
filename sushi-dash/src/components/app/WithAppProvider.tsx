"use client";

import { AppProvider } from "@/context/AppContext";

export default function WithAppProvider({ children }: { children: React.ReactNode }) {
  return <AppProvider>{children}</AppProvider>;
}
