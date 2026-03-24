// useServerEvents.ts — Real-time SSE listener. Connects to GET /api/events and reacts to server-pushed events. Auto-reconnects on disconnects (with 2s backoff).

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { API_BASE } from "@/lib/config";
import { toast } from "sonner";
import { queryKeys } from "./useApiQueries";

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

export interface UseServerEventsOptions {
  /** Whether the user has an active session (customer or staff). */
  enabled?: boolean;
  /** Currently authenticated table ID (customer sessions). */
  tableId?: string | null;
  /** Called when the customer's session is invalidated. */
  onEjected?: () => void;
}

/** React Query key for table presence data */
export const presenceKey = ["table-presence"] as const;

const SSE_CLIENT_ID_KEY = "sushi-dash-sse-client-id";

function getSseClientId(): string | null {
  if (typeof window === "undefined") return null;

  const existing = window.localStorage.getItem(SSE_CLIENT_ID_KEY);
  if (existing) return existing;

  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  window.localStorage.setItem(SSE_CLIENT_ID_KEY, id);
  return id;
}

export function useServerEvents({ tableId, onEjected, enabled = true }: UseServerEventsOptions = {}) {
  const queryClient = useQueryClient();

  // Keep refs so the EventSource callback always sees the latest values
  // without re-subscribing on every render.
  const tableIdRef = useRef(tableId);
  tableIdRef.current = tableId;

  const onEjectedRef = useRef(onEjected);
  onEjectedRef.current = onEjected;

  // Reconnect when tableId changes so server tracks the correct table
  useEffect(() => {
    // Don't connect until the user has an active session
    if (!enabled) return;

    let es: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    function connect() {
      const base = API_BASE;
      const params = new URLSearchParams();
      // Pass tableId as query param so server tracks table presence
      if (tableIdRef.current) {
        params.set("tableId", tableIdRef.current);
      }

      // Stable per-browser client id lets the server replace stale SSE connections
      // when the same user switches tables without leaving zombie presence behind.
      const clientId = getSseClientId();
      if (clientId) {
        params.set("clientId", clientId);
      }

      const query = params.toString();
      const url = query ? `${base}/api/events?${query}` : `${base}/api/events`;
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
  }, [queryClient, tableId, enabled]); // reconnect when tableId changes
}
