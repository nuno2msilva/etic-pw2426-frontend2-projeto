// CustomerPage — Landing page with table selection, PIN authentication, and menu ordering flow.

"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useSearchParams, useRouter } from "next/navigation";
import { API_BASE } from "@/features/shared/lib/config";
import { notifySuccess } from "@/features/shared/lib/notify";
import { UI_TEXT } from "@/features/shared/lib/ui-text";

import { useAuth } from "@/features/shared/context/AuthContext";
import TableSelector from "@/features/customer/components/TableSelector";
import type { Table } from "@/features/shared/types/models";

const PinPad = dynamic(() => import("@/features/customer/components/PinPad").then((mod) => mod.PinPad), {
  ssr: false,
});
const StaffLoginModal = dynamic(() => import("@/features/staff/components/StaffLoginModal"), {
  ssr: false,
});

const CustomerPage = () => {
  const searchParams = useSearchParams();
  const selectParam = searchParams?.get("select");
  const router = useRouter();

  // Skip auto-restore when user explicitly navigated here (e.g. logo click)
  const skipAutoRestore = useRef(selectParam === "true");

  const { isInitialized, customerSession, loginAsCustomer, logout, goToTableSelection, goToTable } = useAuth();
  const [tables, setTables] = useState<Table[]>([]);
  const [tablesError, setTablesError] = useState<string | null>(null);
  const [isLoadingTables, setIsLoadingTables] = useState(true);

  const isCustomerAuthenticated = customerSession !== null;

  // ── Page-specific state ───────────────────────────────────────────────────
  const [pendingTable, setPendingTable] = useState<Table | null>(null);
  const [showPinPad, setShowPinPad] = useState(false);
  const [showStaffLogin, setShowStaffLogin] = useState(false);
  // Track whether we're navigating to the table route (prevents flickering)
  const [isNavigating, setIsNavigating] = useState(false);

  const fetchTables = async () => {
    setIsLoadingTables(true);
    setTablesError(null);
    try {
      const res = await fetch(`${API_BASE}/api/tables`, { credentials: "include" });
      if (!res.ok) {
        throw new Error("Failed to fetch tables");
      }
      const raw = (await res.json()) as Array<Record<string, unknown>>;
      const mapped = raw.map((table) => ({
        ...(table as Omit<Table, "id">),
        id: String(table.id),
      }));
      setTables(mapped);
    } catch (error) {
      setTablesError(error instanceof Error ? error.message : "Failed to fetch tables");
      setTables([]);
    } finally {
      setIsLoadingTables(false);
    }
  };

  useEffect(() => {
    void fetchTables();
  }, []);

  // ── Session effects ───────────────────────────────────────────────────────

  // Logo click: clean up the ?select param
  useEffect(() => {
    if (selectParam === "true" && typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("select");
      window.history.replaceState({}, "", url.pathname + url.search);
    }
  }, [selectParam]);

  // Restore session on mount — verify with backend before auto-restoring
  useEffect(() => {
    if (skipAutoRestore.current) {
      skipAutoRestore.current = false;
      return;
    }
    if (isInitialized && isCustomerAuthenticated && customerSession?.tableId) {
      fetch(`${API_BASE}/api/auth/session`, { credentials: "include" })
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then(
          (data: {
            authenticated: boolean;
            role?: string;
            tableId?: number;
            sessions?: { role: string; tableId?: number | null; authenticated: boolean }[];
          }) => {
            const customerValid = data.sessions
              ? data.sessions.some(
                  (s) => s.role === "customer" && String(s.tableId) === customerSession.tableId,
                )
              : data.authenticated &&
                data.role === "customer" &&
                String(data.tableId) === customerSession.tableId;

            if (customerValid) {
              goToTable();
              setIsNavigating(true);
              router.push(`/table/${customerSession.tableId}`);
            } else {
              void logout();
            }
          },
        )
        .catch(() => {
          void logout();
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized]);

  // ── Table selection handlers ──────────────────────────────────────────────

  const handleSelectTable = (table: Table) => {
    if (isCustomerAuthenticated && customerSession?.tableId === table.id) {
      goToTable();
      setIsNavigating(true);
      router.push(`/table/${table.id}`);
      return;
    }
    setPendingTable(table);
    setShowPinPad(true);
  };

  const handlePinSubmit = async (pin: string): Promise<boolean> => {
    if (!pendingTable) return false;
    const success = await loginAsCustomer(pendingTable.id, pin);
    if (success) {
      setPendingTable(null);
      setShowPinPad(false);
      goToTable();
      setIsNavigating(true);
      void notifySuccess(UI_TEXT.tableWelcomeFor(pendingTable.label));
      router.push(`/table/${pendingTable.id}`);
    }
    return success;
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Table Selection */}
      {!isNavigating && (
        <TableSelector
          tables={tables}
          isLoading={isLoadingTables}
          loadError={!isLoadingTables ? tablesError : null}
          onRetryLoad={() => {
            void fetchTables();
          }}
          onSelectTable={handleSelectTable}
          onStaffLogin={() => setShowStaffLogin(true)}
        />
      )}

      {/* Modals */}
      {showPinPad ? (
        <PinPad
          isOpen={showPinPad}
          tableLabel={pendingTable?.label || "Table"}
          onSubmit={handlePinSubmit}
          onClose={() => {
            setShowPinPad(false);
            setPendingTable(null);
          }}
        />
      ) : null}

      {showStaffLogin ? (
        <StaffLoginModal isOpen={showStaffLogin} onClose={() => setShowStaffLogin(false)} />
      ) : null}
    </>
  );
};

export default CustomerPage;
