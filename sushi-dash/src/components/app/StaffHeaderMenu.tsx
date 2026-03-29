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

const StaffHeaderMenu = () => {
  const pathname = usePathname();
  const router = useRouter();
  const {
    staffSession,
    logoutStaff,
    passwordResetRequired,
    skipPasswordResetReminder,
    passwordChangeReminderDismissedThisSession,
  } = useAuth();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const staffPermission = resolveStaffPermission(staffSession);
  const canAccessKitchen = hasStaffPermission(staffSession, "kitchen");
  const canAccessManager = hasStaffPermission(staffSession, "manager");
  const canAccessAdmin = staffPermission === "admin";

  useEffect(() => {
    const root = document.documentElement;
    setIsDark(root.classList.contains("dark"));
  }, []);

  useEffect(() => {
    if (!staffSession) {
      setShowChangePassword(false);
      return;
    }

    if (passwordResetRequired && !skipPasswordResetReminder && !passwordChangeReminderDismissedThisSession) {
      setShowChangePassword(true);
    }
  }, [staffSession, passwordResetRequired, skipPasswordResetReminder, passwordChangeReminderDismissedThisSession]);

  if (!staffSession) {
    return null;
  }

  const toggleTheme = () => {
    const root = document.documentElement;
    const nextIsDark = !root.classList.contains("dark");
    root.classList.toggle("dark", nextIsDark);
    localStorage.setItem("sushi-dash-theme", nextIsDark ? "dark" : "light");
    setIsDark(nextIsDark);
  };

  const handleLogout = async () => {
    await logoutStaff();
    router.replace("/?select=true");
  };

  const staffDisplayUsername = staffSession.username || staffSession.email || "Staff";

  return (
    <>
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

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
            <User className="w-4 h-4" />
            <span className="hidden md:inline truncate max-w-xs">{staffDisplayUsername}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="bottom"
          align="end"
          sideOffset={10}
          collisionPadding={10}
          className="w-[min(92vw,20rem)] sm:w-56 rounded-2xl border border-border/80 bg-popover p-2 shadow-2xl"
        >
          <div className="px-3 py-2 text-base sm:text-sm font-semibold text-foreground truncate">
            {staffDisplayUsername}
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowChangePassword(true)}
            className="cursor-pointer gap-2 min-h-11 sm:min-h-9 px-3 text-base sm:text-sm"
          >
            <Lock className="w-4 h-4" />
            Change Password
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={toggleTheme}
            className="cursor-pointer gap-2 min-h-11 sm:min-h-9 px-3 text-base sm:text-sm"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {isDark ? "Light Mode" : "Dark Mode"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            className="cursor-pointer gap-2 min-h-11 sm:min-h-9 px-3 text-base sm:text-sm"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <PasswordChangeModal
        open={showChangePassword}
        onOpenChange={setShowChangePassword}
        showReminderActions={passwordResetRequired && !skipPasswordResetReminder}
      />
    </>
  );
};

export default StaffHeaderMenu;
