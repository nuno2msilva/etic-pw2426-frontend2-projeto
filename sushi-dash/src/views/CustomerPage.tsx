// CustomerPage — Landing page with table selection, PIN authentication, and menu ordering flow.

"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { API_BASE } from "@/lib/config";
import { notifySuccess } from "@/lib/notify";
import { UI_TEXT } from "@/lib/ui-text";

import { useAuth } from "@/context/AuthContext";
import TableSelector from "@/components/app/TableSelector";
import type { Table } from "@/types/models";

const PinPad = dynamic(() => import("@/components/app/PinPad").then((mod) => mod.PinPad));
const StaffLoginModal = dynamic(() => import("@/components/app/StaffLoginModal"));
const CustomerMenuStep = dynamic(() => import("@/views/CustomerMenuStep"));
const AppProvider = dynamic(() => import("@/context/AppContext").then((mod) => mod.AppProvider));

type Step = "table" | "menu";

const CustomerPage = () => {
  const searchParams = useSearchParams();
  const selectParam = searchParams?.get("select");

  // Skip auto-restore when user explicitly navigated here (e.g. logo click)
  const skipAutoRestore = useRef(selectParam === "true");

  const { isInitialized, customerSession, loginAsCustomer, logout, goToTableSelection, goToTable } = useAuth();

  const tablesQuery = useQuery<Table[]>({
    queryKey: ["tables"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/tables`, { credentials: "include" });
      if (!res.ok) {
        throw new Error("Failed to fetch tables");
      }
      const raw = (await res.json()) as Array<Record<string, unknown>>;
      return raw.map((table) => ({
        ...(table as Omit<Table, "id">),
        id: String(table.id),
      }));
    },
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 30,
  });

  const tables = tablesQuery.data ?? [];
  const tablesError = tablesQuery.error instanceof Error ? tablesQuery.error.message : null;

  const isCustomerAuthenticated = customerSession !== null;

  // ── Page-specific state ───────────────────────────────────────────────────
  const [step, setStep] = useState<Step>("table");
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [pendingTable, setPendingTable] = useState<Table | null>(null);
  const [showPinPad, setShowPinPad] = useState(false);
  const [showStaffLogin, setShowStaffLogin] = useState(false);

  // Derive the live table from the tables array so SSE name changes propagate
  const liveTable = selectedTable
    ? tables.find((t) => t.id === selectedTable.id) ?? selectedTable
    : null;

  // ── Session effects ───────────────────────────────────────────────────────

  // Logo click: reset to table selection when ?select=true appears in the URL
  useEffect(() => {
    if (selectParam === "true" && step !== "table") {
      // Signal that customer is leaving the table (closes SSE without logout)
      goToTableSelection();
      setStep("table");
      setSelectedTable(null);
      skipAutoRestore.current = true;
    }

    if (selectParam === "true" && typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("select");
      window.history.replaceState({}, "", url.pathname + url.search);
    }
  }, [selectParam]); // eslint-disable-line react-hooks/exhaustive-deps

  // React to session being cleared (e.g. PIN changed by manager via SSE)
  useEffect(() => {
    if (isInitialized && !isCustomerAuthenticated && step !== "table") {
      setStep("table");
      setSelectedTable(null);
    }
  }, [isInitialized, isCustomerAuthenticated, step]); // eslint-disable-line react-hooks/exhaustive-deps

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
              const table = tables.find((t) => t.id === customerSession.tableId);
              if (table) {
                setSelectedTable(table);
                goToTable(); // Signal that customer is now at a table
                setStep("menu");
              }
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
      setSelectedTable(table);
      goToTable(); // Signal that customer is now at a table
      setStep("menu");
      return;
    }
    setPendingTable(table);
    setShowPinPad(true);
  };

  const handlePinSubmit = async (pin: string): Promise<boolean> => {
    if (!pendingTable) return false;
    const success = await loginAsCustomer(pendingTable.id, pin);
    if (success) {
      setSelectedTable(pendingTable);
      setPendingTable(null);
      setShowPinPad(false);
      goToTable(); // Signal that customer is now at a table
      setStep("menu");
      void notifySuccess(UI_TEXT.tableWelcomeFor(pendingTable.label));
    }
    return success;
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Step 1: Table Selection */}
      {step === "table" && (
        <TableSelector
          tables={tables}
          loadError={tablesError}
          onRetryLoad={() => {
            void tablesQuery.refetch();
          }}
          onSelectTable={handleSelectTable}
          onStaffLogin={() => setShowStaffLogin(true)}
        />
      )}

      {/* Step 2: Menu + Cart — reuses the shared MenuOrderingView */}
      {step === "menu" && liveTable && (
        <AppProvider>
          <CustomerMenuStep table={liveTable} />
        </AppProvider>
      )}

      {/* Modals */}
      <PinPad
        isOpen={showPinPad}
        tableLabel={pendingTable?.label || "Table"}
        onSubmit={handlePinSubmit}
        onClose={() => {
          setShowPinPad(false);
          setPendingTable(null);
        }}
      />

      <StaffLoginModal isOpen={showStaffLogin} onClose={() => setShowStaffLogin(false)} />
    </>
  );
};

export default CustomerPage;
