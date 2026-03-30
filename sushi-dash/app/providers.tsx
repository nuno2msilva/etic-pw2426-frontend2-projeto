// Providers — Client-side context tree: QueryClient → Tooltip → Sonner → Auth → SSE → App → CRT.

"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import AppHeader from "@/components/app/AppHeader";
import QueryRuntimeProvider from "@/components/app/QueryRuntimeProvider";
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
const LiveUpdatesClient = dynamic(() => import("@/components/app/LiveUpdatesClient"), {
  ssr: false,
});

export function resolvePresenceTableId(
  authenticatedTableId: string | null,
  hasStaffSession: boolean,
): string | null {
  return hasStaffSession ? null : authenticatedTableId;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [showToaster, setShowToaster] = useState(false);

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

  return (
    <QueryRuntimeProvider>
      <AuthProvider>
        <ProvidersShell showToaster={showToaster}>{children}</ProvidersShell>
      </AuthProvider>
    </QueryRuntimeProvider>
  );
}

function ProvidersShell({ children, showToaster }: { children: React.ReactNode; showToaster: boolean }) {
  const pathname = usePathname();
  const { authenticatedTableId, staffSession } = useAuth();
  const hasSession = Boolean(authenticatedTableId || staffSession);
  const shouldMountLiveUpdates = hasSession;
  const shouldMountToaster = showToaster && (hasSession || pathname !== "/");

  const appContent = (
    <>
      {ENABLE_WEB_VITALS_REPORTER ? <WebVitalsReporter /> : null}
      {shouldMountLiveUpdates ? <LiveUpdatesClient /> : null}
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
    </>
  );

  return (
    <>
      {shouldMountToaster ? <Sonner /> : null}
      {appContent}
    </>
  );
}
