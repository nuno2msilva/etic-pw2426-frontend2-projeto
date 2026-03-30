import { useQueryClient as rqUseQueryClient } from "@tanstack/react-query";

/**
 * Optional hook for useQueryClient - returns null if QueryClientProvider is not in the tree
 * Used in contexts that may not always have QueryClient available (e.g., landing page)
 */
export function useOptionalQueryClient() {
  try {
    // Try to get the query client; this will throw if not wrapped in QueryClientProvider
    return rqUseQueryClient();
  } catch {
    // QueryClientProvider not in tree - safe to return null
    return null;
  }
}
