import { useQuery } from "@tanstack/react-query";
import { API_BASE } from "@/lib/config";
import { presenceKey } from "@/hooks/useServerEvents";

export function useTablePresence() {
  return useQuery<Record<number, number>>({
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
    refetchInterval: 3000,
  });
}
