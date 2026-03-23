// TablePage — QR-authenticated customer ordering page for a specific table.

"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useOrderingFlow } from "@/hooks/useOrderingFlow";
import { MenuOrderingView, SEOHead } from "@/components/app";

const TablePage = () => {
  const params = useParams<{ tableId: string }>();
  const tableId = params?.tableId;
  const searchParams = useSearchParams();
  const router = useRouter();

  const { tables, isLoading } = useApp();
  const { loginAsCustomer, authenticatedTableId } = useAuth();

  // Track whether PIN auto-auth is in progress (prevents premature redirect)
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Find the table from the URL param
  const table = tables.find((t) => t.id === tableId);

  // Shared cart + ordering logic
  const flow = useOrderingFlow(table);

  // Auto-authenticate from QR code ?pin= param, then strip it from the URL
  useEffect(() => {
    const pin = searchParams?.get("pin");
    if (pin && tableId) {
      setIsAuthenticating(true);
      loginAsCustomer(tableId, pin)
        .then((ok) => {
          if (ok) {
            toast.success("Welcome! 🍣");
            const url = new URL(window.location.href);
            url.searchParams.delete("pin");
            window.history.replaceState({}, "", url.pathname + url.search);
          }
        })
        .catch(() => {})
        .finally(() => setIsAuthenticating(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Loading state
  if (isLoading || isAuthenticating) {
    return (
      <main className="h-full overflow-y-auto max-w-5xl mx-auto px-4 py-8">
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-5xl mb-4">🍣</p>
          <p className="text-lg">Loading...</p>
        </div>
      </main>
    );
  }

  // Redirect if table not found or not authenticated
  if (!table || authenticatedTableId !== tableId) {
    router.replace("/");
    return null;
  }

  return (
    <MenuOrderingView table={table} flow={flow} showClearCart>
      <SEOHead
        title={`${table.label} — Order`}
        description={`Browse and order from 100+ sushi items at ${table.label}. All-you-can-eat menu with real-time order tracking.`}
      />
    </MenuOrderingView>
  );
};

export default TablePage;
