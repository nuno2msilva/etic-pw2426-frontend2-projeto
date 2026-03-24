// Providers — Client-side context tree: QueryClient → Tooltip → Sonner → Auth → SSE → App → CRT.

"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/context/AppContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { useServerEvents } from "@/hooks/useServerEvents";
import AppHeader from "@/components/app/AppHeader";
import CRTScreen from "@/components/app/CRTScreen";
import WebVitalsReporter from "@/components/app/WebVitalsReporter";
import { ENABLE_CRT_EFFECT } from "@/lib/config";

const queryClient = new QueryClient();

export function resolvePresenceTableId(
  authenticatedTableId: string | null,
  hasStaffSession: boolean,
): string | null {
  return hasStaffSession ? null : authenticatedTableId;
}

/** Invisible component that keeps a single SSE connection alive. */
function LiveUpdates() {
  const { authenticatedTableId, staffSession, logout } = useAuth();
  const presenceTableId = resolvePresenceTableId(authenticatedTableId, Boolean(staffSession));

  useServerEvents({
    tableId: presenceTableId,
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
          <WebVitalsReporter />
          <LiveUpdates />
          <AppProvider>
            <CRTScreen enabled={ENABLE_CRT_EFFECT}>
              <div className="h-dvh flex flex-col overflow-hidden">
                <AppHeader />
                <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
              </div>
            </CRTScreen>
          </AppProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
