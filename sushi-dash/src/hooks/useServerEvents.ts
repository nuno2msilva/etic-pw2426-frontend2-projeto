// useServerEvents.ts — Real-time SSE listener. Connects to GET /api/events and reacts to server-pushed events. Auto-reconnects on disconnects with exponential backoff.

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { API_BASE } from "@/lib/config";
import { notifyError } from "@/lib/notify";
import { SSE_RECONNECT_DELAY_MS, SSE_MAX_RECONNECT_DELAY_MS, PRESENCE_POLLING_INTERVAL_MS } from "@/lib/timeouts";
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
    let reconnectAttempts = 0; // Track attempts for exponential backoff

    function calculateBackoffDelay(attempts: number): number {
      // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s (capped)
      const exponential = SSE_RECONNECT_DELAY_MS * Math.pow(2, attempts);
      return Math.min(exponential, SSE_MAX_RECONNECT_DELAY_MS);
    }

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
        // Connection successful, reset backoff counter
        reconnectAttempts = 0;

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
              void notifyError("Your table's PIN was changed — please log in again.");
              onEjectedRef.current?.();
            }
            queryClient.invalidateQueries({ queryKey: queryKeys.tables });
            break;
          }

          case "table-deleted": {
            if (tableIdRef.current && Number(tableIdRef.current) === event.tableId) {
              void notifyError("Your table was removed — returning to table selection.");
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
        // Exponential backoff with cap to prevent reconnect storms (Vercel optimization)
        reconnectAttempts++;
        const delay = calculateBackoffDelay(reconnectAttempts);
        reconnectTimer = setTimeout(connect, delay);
      };
    }

    connect();

    // Graceful close on tab/browser unload (triggers server cleanup without logout)
    const handleBeforeUnload = () => {
      es?.close();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearTimeout(reconnectTimer);
      es?.close();
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [queryClient, tableId, enabled]); // reconnect when tableId changes
}

/**
 * Aggressive presence polling hook (Vercel optimization).
 * Polls table presence every 3 seconds as a fallback if SSE drops.
 * This ensures table badges stay accurate despite network latency.
 */
export function usePresencePolling(enabled = true): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    let pollTimer: ReturnType<typeof setInterval>;

    async function pollPresence() {
      if (typeof document !== "undefined" && document.hidden) {
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/api/events/presence`, {
          credentials: "include",
        });
        if (!response.ok) return;

        const data = (await response.json()) as {
          presence?: Record<number, number>;
        };
        if (data.presence) {
          queryClient.setQueryData(presenceKey, data.presence);
        }
      } catch {
        // Silently fail; SSE fallback or next poll will retry
      }
    }

    // Start polling
  void pollPresence();
    pollTimer = setInterval(pollPresence, PRESENCE_POLLING_INTERVAL_MS);

    return () => {
      clearInterval(pollTimer);
    };
  }, [enabled, queryClient]);
}
