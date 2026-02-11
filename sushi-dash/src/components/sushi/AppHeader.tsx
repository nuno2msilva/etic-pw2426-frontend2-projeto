/**
 * ==========================================================================
 * AppHeader — Global navigation header with dark mode toggle
 * ==========================================================================
 *
 * Sticky header displayed on every page. Features:
 *   - Logo link ("🍣 Sushi Dash") → navigates to home page
 *   - Dark mode toggle (persists preference in localStorage)
 *   - Navigation links (only shown on manager page for access to kitchen)
 *
 * Theme logic:
 *   1. Check localStorage for saved preference
 *   2. Fall back to system preference (prefers-color-scheme)
 *   3. Toggle adds/removes "dark" class on <html> element
 *
 * ==========================================================================
 */

import { Link, useLocation } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * App header with logo and dark mode toggle
 * Navigation is only shown on the manager page
 */
const AppHeader = () => {
  const { pathname } = useLocation();
  const isManager = pathname === "/manager";
  
  const [isDark, setIsDark] = useState(() => {
    // Check localStorage or system preference
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sushi-dash-theme');
      if (stored) return stored === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Apply theme on mount and when changed
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

  return (
    <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">🍣</span>
          <span className="font-display text-xl font-bold text-foreground">
            Sushi <span className="text-primary">Dash</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Navigation - only shown on manager page */}
          {isManager && (
            <nav className="flex gap-1 mr-2">
              <Link
                to="/kitchen"
                className="px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                🔥 Kitchen
              </Link>
            </nav>
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
