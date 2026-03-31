// Providers — Client-side context tree: Auth → QueryClient (conditional) → Tooltip → Sonner → SSE → App → CRT.

"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "@/features/shared/context/AuthContext";
import { usePageTracking } from "@/features/shared/hooks/usePageTracking";
import { ENABLE_CRT_EFFECT, ENABLE_WEB_VITALS_REPORTER } from "@/features/shared/lib/config";

const QueryRuntimeProvider = dynamic(() => import("@/features/shared/context/QueryRuntimeProvider"));

const Sonner = dynamic(() => import("@/components/ui/sonner").then((mod) => mod.Toaster), {
  ssr: false,
});
const WebVitalsReporter = dynamic(() => import("@/features/shared/components/WebVitalsReporter"), {
  ssr: false,
});
const CRTScreen = dynamic(() => import("@/features/shared/components/CRTScreen"), {
  ssr: false,
});
const LiveUpdatesClient = dynamic(() => import("@/features/shared/components/LiveUpdatesClient"), {
  ssr: false,
});
const AppHeader = dynamic(() => import("@/features/shared/components/AppHeader"), {
  ssr: false,
});

export function resolvePresenceTableId(
  authenticatedTableId: string | null,
  hasStaffSession: boolean,
): string | null {
  return hasStaffSession ? null : authenticatedTableId;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Home route: keep the shell minimal and skip global React Query runtime.
  // This cuts startup JS and main-thread work on Lighthouse mobile audits.
  if (pathname === "/") {
    return (
      <AuthProvider>
        {ENABLE_CRT_EFFECT ? (
          <CRTScreen enabled>
            <div className="h-dvh flex flex-col overflow-hidden">
              <LightHeader />
              <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
            </div>
          </CRTScreen>
        ) : (
          <div className="h-dvh flex flex-col overflow-hidden">
            <LightHeader />
            <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
          </div>
        )}
      </AuthProvider>
    );
  }

  return (
    <QueryRuntimeProvider>
      <AuthProvider>
        <ProvidersShell>{children}</ProvidersShell>
      </AuthProvider>
    </QueryRuntimeProvider>
  );
}

function ProvidersShell({ children }: { children: React.ReactNode }) {
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
    <ProviderContent showToaster={showToaster}>{children}</ProviderContent>
  );
}

function ProviderContent({ children, showToaster }: { children: React.ReactNode; showToaster: boolean }) {
  const pathname = usePathname();
  const { authenticatedTableId, staffSession } = useAuth();
  
  // Track all page views automatically
  usePageTracking();
  
  const hasSession = Boolean(authenticatedTableId || staffSession);
  const useLightHeader = pathname === "/" && !hasSession;
  const shouldMountLiveUpdates = hasSession;
  const shouldMountToaster = showToaster && (hasSession || pathname !== "/");

  const appContent = (
    <>
      {ENABLE_WEB_VITALS_REPORTER ? <WebVitalsReporter /> : null}
      {shouldMountLiveUpdates ? <LiveUpdatesClient /> : null}
      {ENABLE_CRT_EFFECT ? (
        <CRTScreen enabled>
          <div className="h-dvh flex flex-col overflow-hidden">
            {useLightHeader ? <LightHeader /> : <AppHeader />}
            <div className="flex-1 min-h-0 overflow-auto">{children}</div>
          </div>
        </CRTScreen>
      ) : (
        <div className="h-dvh flex flex-col overflow-hidden">
          {useLightHeader ? <LightHeader /> : <AppHeader />}
          <div className="flex-1 min-h-0 overflow-auto">{children}</div>
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

function LightHeader() {
  const [isDark, setIsDark] = useState(false);
  const [isThemeReady, setIsThemeReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("sushi-dash-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDark(stored ? stored === "dark" : prefersDark);
    setIsThemeReady(true);
  }, []);

  useEffect(() => {
    if (!isThemeReady) return;

    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("sushi-dash-theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("sushi-dash-theme", "light");
    }
  }, [isDark, isThemeReady]);

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <header className="sticky top-0 z-50 border-b bg-card/95">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🍣</span>
          <span className="type-title">
            Sushi <span className="text-primary">Dash</span>
          </span>
        </Link>
        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          title={isDark ? "Light mode" : "Dark mode"}
        >
          <span aria-hidden="true">{isDark ? "☀" : "🌙"}</span>
        </button>
      </div>
    </header>
  );
}
