/**
 * ==========================================================================
 * Providers — Client-side provider tree
 * ==========================================================================
 *
 * Wraps the application with all client-side context providers.
 * Extracted from the layout because Next.js layouts are Server Components
 * by default, but React Query / Auth / App contexts require "use client".
 *
 * Provider hierarchy (outermost → innermost):
 *   QueryClientProvider → TooltipProvider → Sonner →
 *   AuthProvider → LiveUpdates → AppProvider → AppHeader → {children}
 * ==========================================================================
 */

"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/context/AppContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { useServerEvents } from "@/hooks/useServerEvents";
import AppHeader from "@/components/app/AppHeader";
import CRTScreen from "@/components/app/CRTScreen";

const queryClient = new QueryClient();

/** Invisible component that keeps a single SSE connection alive. */
function LiveUpdates() {
  const { authenticatedTableId, logout } = useAuth();
  useServerEvents({
    tableId: authenticatedTableId,
    onEjected: logout,
    enabled: true,
  });
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
        <AuthProvider>
          <LiveUpdates />
          <AppProvider>
            <CRTScreen>
              <AppHeader />
              {children}
            </CRTScreen>
          </AppProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
