// Providers — Client-side context tree: QueryClient → Tooltip → Sonner → Auth → SSE → App → CRT.

"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { useServerEvents, usePresencePolling } from "@/hooks/useServerEvents";
import AppHeader from "@/components/app/AppHeader";
import { ENABLE_CRT_EFFECT, ENABLE_WEB_VITALS_REPORTER } from "@/lib/config";

const Sonner = dynamic(() => import("@/components/ui/sonner").then((mod) => mod.Toaster), {
  ssr: false,
});
const WebVitalsReporter = dynamic(() => import("@/components/app/WebVitalsReporter"), {
  ssr: false,
});
const CRTScreen = dynamic(() => import("@/components/app/CRTScreen"), {
  ssr: false,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
    },
  },
});

export function resolvePresenceTableId(
  authenticatedTableId: string | null,
  hasStaffSession: boolean,
): string | null {
  return hasStaffSession ? null : authenticatedTableId;
}

/** Invisible component that keeps a single SSE connection alive. */
function LiveUpdates() {
  const { authenticatedTableId, staffSession, logout, isViewingTableSelection } = useAuth();
  const pathname = usePathname();
  const presenceTableId = resolvePresenceTableId(authenticatedTableId, Boolean(staffSession));
  const isAuthenticated = Boolean(authenticatedTableId || staffSession);

  const shouldPollPresence = Boolean(pathname?.startsWith("/manager"));

  // Don't maintain SSE presence when customer is at table selection (temporarily closes connection)
  const effectiveTableId = isViewingTableSelection ? null : presenceTableId;

  useServerEvents({
    tableId: effectiveTableId,
    onEjected: logout,
    enabled: isAuthenticated,
  });

  // Aggressive presence polling as fallback (Vercel optimization)
  usePresencePolling(shouldPollPresence);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [showToaster, setShowToaster] = useState(false);
  const [enableLiveUpdates, setEnableLiveUpdates] = useState(false);

  useEffect(() => {
    const idleWindow = window as Window & {
      requestIdleCallback?: (cb: () => void) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (typeof idleWindow.requestIdleCallback === "function") {
      const idleId = idleWindow.requestIdleCallback(() => setShowToaster(true));
      return () => {
        if (typeof idleWindow.cancelIdleCallback === "function") {
          idleWindow.cancelIdleCallback(idleId);
        }
      };
    }

    const timeoutId = window.setTimeout(() => setShowToaster(true), 1200);
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    const idleWindow = window as Window & {
      requestIdleCallback?: (cb: () => void) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (typeof idleWindow.requestIdleCallback === "function") {
      const idleId = idleWindow.requestIdleCallback(() => setEnableLiveUpdates(true));
      return () => {
        if (typeof idleWindow.cancelIdleCallback === "function") {
          idleWindow.cancelIdleCallback(idleId);
        }
      };
    }

    const timeoutId = window.setTimeout(() => setEnableLiveUpdates(true), 1500);
    return () => window.clearTimeout(timeoutId);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {showToaster ? <Sonner /> : null}
      <AuthProvider>
        {ENABLE_WEB_VITALS_REPORTER ? <WebVitalsReporter /> : null}
        {enableLiveUpdates ? <LiveUpdates /> : null}
        {ENABLE_CRT_EFFECT ? (
          <CRTScreen enabled>
            <div className="h-dvh flex flex-col overflow-hidden">
              <AppHeader />
              <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
            </div>
          </CRTScreen>
        ) : (
          <div className="h-dvh flex flex-col overflow-hidden">
            <AppHeader />
            <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
          </div>
        )}
      </AuthProvider>
    </QueryClientProvider>
  );
}
