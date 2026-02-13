/**
 * ==========================================================================
 * AppHeader — Global navigation header with dark mode toggle & logout
 * ==========================================================================
 *
 * Sticky header displayed on every page. Features:
 *   - Logo ("🍣 Sushi Dash") → always navigates to / (table select)
 *   - Context-aware logout button (customer or staff)
 *   - Dark mode toggle (persists preference in localStorage)
 *   - Kitchen link (shown on manager page)
 *
 * ==========================================================================
 */

import { Link, useLocation, useNavigate } from "react-router-dom";
import { Moon, Sun, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

const AppHeader = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { customerSession, staffSession, logout, logoutStaff, checkAccess } = useAuth();

  const isStaffPage = pathname === "/manager" || pathname === "/kitchen";
  const isKitchen = pathname === "/kitchen";
  const isManagerPage = pathname === "/manager";
  const hasManagerAccess = checkAccess('manager');

  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sushi-dash-theme');
      if (stored) return stored === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('sushi-dash-theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('sushi-dash-theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  const handleLogout = () => {
    if (isStaffPage && staffSession) {
      logoutStaff();
      navigate("/");
    } else if (customerSession) {
      logout();
      // CustomerPage will detect session cleared and reset to table step
    }
  };

  const showLogout = isStaffPage ? !!staffSession : !!customerSession;

  return (
    <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" state={{ showTableSelect: true }} className="flex items-center gap-2">
          <span className="text-2xl">🍣</span>
          <span className="font-display text-xl font-bold text-foreground">
            Sushi <span className="text-primary">Dash</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Manager ↔ Kitchen nav shortcuts */}
          {hasManagerAccess && isStaffPage && (
            <nav className="flex gap-1 mr-2">
              {isManagerPage && (
                <Link
                  to="/kitchen"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                >
                  🔥 Kitchen
                </Link>
              )}
              {isKitchen && (
                <Link
                  to="/manager"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                >
                  ⚙️ Manager
                </Link>
              )}
            </nav>
          )}

          {/* Logout */}
          {showLogout && (
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          )}

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Light mode' : 'Dark mode'}
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
