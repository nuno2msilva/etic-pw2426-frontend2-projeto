/**
 * useServerEvents.ts — Real-time SSE listener
 * ---------------------------------------------------------------------------
 * Connects to GET /api/events and reacts to server-pushed events:
 *
 *   pin-changed / table-deleted  → eject customer for that table
 *   order-*                      → invalidate orders cache
 *   menu-changed                 → invalidate menu + categories cache
 *   settings-changed             → invalidate settings cache
 *   table-added / table-updated  → invalidate tables cache
 *   table-presence               → update presence cache (in-use badges)
 *
 * The hook auto-reconnects on disconnects (with 2 s backoff).
 * When the customer's tableId changes the SSE reconnects so the server
 * can track per-table presence correctly.
 * ---------------------------------------------------------------------------
 */

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "./useQueries";

/** Must match ServerEvent union in server/src/events.ts */
type ServerEvent =
  | { type: "pin-changed"; tableId: number }
  | { type: "table-deleted"; tableId: number }
  | { type: "table-added"; tableId: number }
  | { type: "table-updated"; tableId: number }
  | { type: "order-created"; tableId: number; orderId: number }
  | { type: "order-updated"; orderId: number; status: string; tableId: number }
  | { type: "order-cancelled"; orderId: number; tableId: number }
  | { type: "order-deleted"; orderId: number }
  | { type: "menu-changed" }
  | { type: "settings-changed" }
  | { type: "table-presence"; presence: Record<number, number> };

interface UseServerEventsOptions {
  /** Currently authenticated table ID (customer sessions). */
  tableId?: string | null;
  /** Called when the customer's session is invalidated. */
  onEjected?: () => void;
}

/** React Query key for table presence data */
export const presenceKey = ["table-presence"] as const;

export function useServerEvents({ tableId, onEjected }: UseServerEventsOptions = {}) {
  const queryClient = useQueryClient();

  // Keep refs so the EventSource callback always sees the latest values
  // without re-subscribing on every render.
  const tableIdRef = useRef(tableId);
  tableIdRef.current = tableId;

  const onEjectedRef = useRef(onEjected);
  onEjectedRef.current = onEjected;

  // Reconnect when tableId changes so server tracks the correct table
  useEffect(() => {
    let es: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    function connect() {
      // Pass tableId as query param so server tracks table presence
      const url = tableIdRef.current
        ? `/api/events?tableId=${tableIdRef.current}`
        : "/api/events";
      es = new EventSource(url);

      es.onmessage = (msg) => {
        let event: ServerEvent;
        try {
          event = JSON.parse(msg.data);
        } catch {
          return; // ignore malformed events / comments
        }

        switch (event.type) {
          // ── PIN / table lifecycle ────────────────────────
          case "pin-changed": {
            // If this customer is sitting at the affected table → eject
            if (tableIdRef.current && Number(tableIdRef.current) === event.tableId) {
              toast.error("Your table's PIN was changed — please log in again.");
              onEjectedRef.current?.();
            }
            queryClient.invalidateQueries({ queryKey: queryKeys.tables });
            break;
          }

          case "table-deleted": {
            if (tableIdRef.current && Number(tableIdRef.current) === event.tableId) {
              toast.error("Your table was removed — returning to table selection.");
              onEjectedRef.current?.();
            }
            queryClient.invalidateQueries({ queryKey: queryKeys.tables });
            break;
          }

          case "table-added":
          case "table-updated":
            queryClient.invalidateQueries({ queryKey: queryKeys.tables });
            break;

          // ── Orders ──────────────────────────────────────
          case "order-created":
          case "order-updated":
          case "order-cancelled":
          case "order-deleted":
            queryClient.invalidateQueries({ queryKey: queryKeys.orders });
            break;

          // ── Menu ────────────────────────────────────────
          case "menu-changed":
            queryClient.invalidateQueries({ queryKey: queryKeys.menu });
            queryClient.invalidateQueries({ queryKey: queryKeys.categories });
            break;

          // ── Settings ────────────────────────────────────
          case "settings-changed":
            queryClient.invalidateQueries({ queryKey: queryKeys.settings });
            break;

          // ── Table presence (in-use badges) ──────────────
          case "table-presence":
            queryClient.setQueryData(presenceKey, event.presence);
            break;
        }
      };

      es.onerror = () => {
        es?.close();
        // Reconnect after a short delay
        reconnectTimer = setTimeout(connect, 2000);
      };
    }

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      es?.close();
    };
  }, [queryClient, tableId]); // reconnect when tableId changes
}
