import { useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { API_BASE } from "@/features/shared/lib/config";
import { presenceKey } from "@/features/shared/hooks/useServerEvents";
import { PRESENCE_POLLING_INTERVAL_MS } from "@/features/shared/lib/timeouts";

// Keep a short debounce for transient transport blips, but clear stale ON state quickly.
const PRESENCE_OFF_GRACE_MS = 5_000;

export function stabilizePresenceSnapshot(
  incoming: Record<number, number> | undefined,
  previousStable: Record<number, number>,
  lastSeenAt: Map<number, number>,
  now: number,
  graceMs: number,
): Record<number, number> {
  const normalizedIncoming = incoming ?? {};
  const stabilized: Record<number, number> = {};

  for (const [rawId, count] of Object.entries(normalizedIncoming)) {
    const tableId = parseInt(rawId, 10);
    if (Number.isNaN(tableId) || typeof count !== "number" || count <= 0) continue;

    stabilized[tableId] = count;
    lastSeenAt.set(tableId, now);
  }

  for (const [tableId, seenAt] of lastSeenAt) {
    if (now - seenAt > graceMs) {
      lastSeenAt.delete(tableId);
      continue;
    }

    if (typeof stabilized[tableId] === "number") continue;

    const previousCount = previousStable[tableId];
    stabilized[tableId] = typeof previousCount === "number" && previousCount > 0 ? previousCount : 1;
  }

  return stabilized;
}

export function useTablePresence() {
  const lastSeenAtRef = useRef<Map<number, number>>(new Map());
  const previousStableRef = useRef<Record<number, number>>({});

  const query = useQuery<Record<number, number>>({
    queryKey: [...presenceKey],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/tables/presence`, { credentials: "include" });
      if (!res.ok) {
        throw new Error("Failed to fetch table presence");
      }
      const data = (await res.json()) as { presence?: Record<number, number> };
      return data.presence ?? {};
    },
    staleTime: 1000,
    refetchInterval: PRESENCE_POLLING_INTERVAL_MS,
    refetchIntervalInBackground: true,
    retry: 1,
    structuralSharing: false,
  });

  const stabilizedData = useMemo(() => {
    const stabilized = stabilizePresenceSnapshot(
      query.data,
      previousStableRef.current,
      lastSeenAtRef.current,
      Date.now(),
      PRESENCE_OFF_GRACE_MS,
    );

    previousStableRef.current = stabilized;
    return stabilized;
  }, [query.data]);

  return {
    ...query,
    data: stabilizedData,
  };
}
