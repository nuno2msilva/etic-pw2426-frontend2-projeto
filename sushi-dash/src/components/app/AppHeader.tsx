// AppHeader — sticky nav bar with logo, dark-mode toggle, context-aware logout, and staff actions.

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Moon, Sun, LogOut, User, Lock, Flame, Settings, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { hasStaffPermission, resolveStaffPermission } from "@/lib/auth";
import { PasswordChangeModal } from "@/components/app/PasswordChangeModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown";

const AppHeader = () => {
  const pathname = usePathname();
  const router = useRouter();
  const {
    customerSession,
    staffSession,
    logout,
    logoutStaff,
    passwordResetRequired,
    skipPasswordResetReminder,
    passwordChangeReminderDismissedThisSession,
  } = useAuth();
  const [showChangePassword, setShowChangePassword] = useState(false);

  const staffPermission = resolveStaffPermission(staffSession);
  const canAccessKitchen = hasStaffPermission(staffSession, "kitchen");
  const canAccessManager = hasStaffPermission(staffSession, "manager");
  const canAccessAdmin = staffPermission === "admin";

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

  // Show password change modal if needed
  useEffect(() => {
    if (!staffSession) {
      setShowChangePassword(false);
      return;
    }
    // Show if: password needs reset AND user hasn't permanently skipped AND hasn't dismissed this session
    if (passwordResetRequired && !skipPasswordResetReminder && !passwordChangeReminderDismissedThisSession) {
      setShowChangePassword(true);
    }
  }, [staffSession, passwordResetRequired, skipPasswordResetReminder, passwordChangeReminderDismissedThisSession]);
  const toggleTheme = () => setIsDark(!isDark);

  const handleLogout = () => {
    if (staffSession) {
      logoutStaff();
      router.replace("/?select=true");
    } else if (customerSession) {
      logout();
      router.replace("/?select=true");
    }
  };

  const showLogout = !!staffSession || !!customerSession;
  const staffDisplayUsername = staffSession?.username || staffSession?.email || "Staff";

  return (
    <>
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/?select=true" className="flex items-center gap-2">
            <span className="text-2xl">🍣</span>
            <span className="font-display text-xl font-bold text-foreground">
              Sushi <span className="text-primary">Dash</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            {staffSession && (
              <nav className="flex gap-1 mr-2">
                {canAccessKitchen && pathname !== "/kitchen" && (
                  <Link
                    href="/kitchen"
                    className="h-9 w-9 sm:w-auto px-2 sm:px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors inline-flex items-center justify-center gap-1.5"
                    aria-label="Kitchen"
                    title="Kitchen"
                  >
                    <Flame className="w-4 h-4" />
                    <span className="hidden sm:inline">Kitchen</span>
                  </Link>
                )}
                {canAccessManager && pathname !== "/manager" && (
                  <Link
                    href="/manager"
                    className="h-9 w-9 sm:w-auto px-2 sm:px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors inline-flex items-center justify-center gap-1.5"
                    aria-label="Manager"
                    title="Manager"
                  >
                    <Settings className="w-4 h-4" />
                    <span className="hidden sm:inline">Manager</span>
                  </Link>
                )}
                {canAccessAdmin && pathname !== "/admin" && (
                  <Link
                    href="/admin"
                    className="h-9 w-9 sm:w-auto px-2 sm:px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors inline-flex items-center justify-center gap-1.5"
                    aria-label="Admin"
                    title="Admin"
                  >
                    <Shield className="w-4 h-4" />
                    <span className="hidden sm:inline">Admin</span>
                  </Link>
                )}
              </nav>
            )}

            {staffSession && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
                    <User className="w-4 h-4" />
                    <span className="hidden md:inline truncate max-w-xs">{staffDisplayUsername}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5 text-sm font-medium text-foreground">{staffDisplayUsername}</div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowChangePassword(true)} className="cursor-pointer gap-2">
                    <Lock className="w-4 h-4" />
                    Change Password
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer gap-2">
                    {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    {isDark ? "Light Mode" : "Dark Mode"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer gap-2">
                    <LogOut className="w-4 h-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {!staffSession && showLogout && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}

            {!staffSession && !showLogout && (
              <button
                onClick={toggleTheme}
                className="w-10 h-10 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                title={isDark ? "Light mode" : "Dark mode"}
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>
      </header>

      <PasswordChangeModal
        open={showChangePassword}
        onOpenChange={setShowChangePassword}
        showReminderActions={passwordResetRequired && !skipPasswordResetReminder}
      />
    </>
  );
};

export default AppHeader;
