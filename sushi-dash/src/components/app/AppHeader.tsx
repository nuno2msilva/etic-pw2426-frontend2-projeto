// AppHeader — sticky nav bar with logo, dark-mode toggle, context-aware logout, and staff actions.

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

const StaffHeaderMenu = dynamic(() => import("@/components/app/StaffHeaderMenu"), {
  ssr: false,
});

const AppHeader = () => {
  const router = useRouter();
  const {
    customerSession,
    staffSession,
    logout,
    logoutStaff,
  } = useAuth();

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

  const handleLogout = async () => {
    if (staffSession) {
      await logoutStaff();
      router.replace("/?select=true");
    } else if (customerSession) {
      await logout();
      router.replace("/?select=true");
    }
  };

  const showLogout = !!staffSession || !!customerSession;
  const logoHref = customerSession && !staffSession ? "/?select=true" : "/";

  return (
    <>
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href={logoHref} className="flex items-center gap-2">
            <span className="text-2xl">🍣</span>
            <span className="type-title">
              Sushi <span className="text-primary">Dash</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            {staffSession && <StaffHeaderMenu />}

            {!staffSession && showLogout && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                aria-label="Logout"
              >
                <span aria-hidden="true">↩</span>
                <span className="hidden sm:inline type-caption">Logout</span>
              </button>
            )}

            {!staffSession && !showLogout && (
              <button
                onClick={toggleTheme}
                className="w-10 h-10 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                title={isDark ? "Light mode" : "Dark mode"}
              >
                <span aria-hidden="true">{isDark ? "☀" : "🌙"}</span>
              </button>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

export default AppHeader;
