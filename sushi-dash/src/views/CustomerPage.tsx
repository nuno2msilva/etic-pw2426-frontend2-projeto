// CustomerPage — Landing page with table selection, PIN authentication, and menu ordering flow.

"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { API_BASE } from "@/lib/config";
import { UI_TEXT } from "@/lib/ui-text";

import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useOrderingFlow } from "@/hooks/useOrderingFlow";
import {
  TableSelector,
  MenuOrderingView,
  PinPad,
  StaffLoginModal,
} from "@/components/app";
import type { Table } from "@/types/models";

type Step = "table" | "menu";

const CustomerPage = () => {
  const searchParams = useSearchParams();
  const selectParam = searchParams?.get("select");

  // Skip auto-restore when user explicitly navigated here (e.g. logo click)
  const skipAutoRestore = useRef(selectParam === "true");

  const { tables, settings, tablesError, reloadTables } = useApp();
  const { isInitialized, customerSession, loginAsCustomer, logout, goToTableSelection, goToTable } = useAuth();

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

  // Shared cart + ordering logic
  const flow = useOrderingFlow(liveTable);

  // ── Session effects ───────────────────────────────────────────────────────

  // Logo click: reset to table selection when ?select=true appears in the URL
  useEffect(() => {
    if (selectParam === "true" && step !== "table") {
      // Signal that customer is leaving the table (closes SSE without logout)
      goToTableSelection();
      setStep("table");
      setSelectedTable(null);
      flow.setCart({});
      flow.setOpenCategories(new Set());
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
      flow.setCart({});
      flow.setOpenCategories(new Set());
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
      toast.success(UI_TEXT.tableWelcomeFor(pendingTable.label));
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
            void reloadTables();
          }}
          onSelectTable={handleSelectTable}
          onStaffLogin={() => setShowStaffLogin(true)}
        />
      )}

      {/* Step 2: Menu + Cart — reuses the shared MenuOrderingView */}
      {step === "menu" && liveTable && (
        <MenuOrderingView table={liveTable} flow={flow} />
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
