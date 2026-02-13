/**
 * ==========================================================================
 * StaffLoginPage — Unified login for Kitchen and Manager
 * ==========================================================================
 *
 * Single login page that automatically routes to:
 *   - Kitchen dashboard if kitchen password is entered
 *   - Manager panel if manager password is entered
 *
 * Route: /staff
 * ==========================================================================
 */

import { useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { SEOHead } from "@/components/sushi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Eye, EyeOff } from "lucide-react";

const StaffLoginPage = () => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { loginAsKitchen, loginAsManager } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      setIsLoading(true);

      try {
        // Try manager login first
        const isManager = await loginAsManager(password);
        if (isManager) {
          navigate("/manager");
          return;
        }

        // Try kitchen login
        const isKitchen = await loginAsKitchen(password);
        if (isKitchen) {
          navigate("/kitchen");
          return;
        }

        // Both failed
        setError("Invalid password. Please try again.");
      } catch (err) {
        setError("An error occurred. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [password, loginAsKitchen, loginAsManager, navigate]
  );

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-background to-muted/20">
      <SEOHead
        title="Staff Login"
        description="Login to access kitchen dashboard or manager panel"
      />

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display font-bold text-foreground mb-2">
            🔐 Staff Login
          </h1>
          <p className="text-muted-foreground">
            Enter your password to access the dashboard
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-card border rounded-xl p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-foreground block"
              >
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter staff password"
                  className="w-full pr-10"
                  autoFocus
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>

          {/* Hint */}
          <p className="mt-6 pt-4 border-t text-xs text-muted-foreground text-center">
            Your password determines your access level automatically.
          </p>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Button variant="ghost" asChild>
            <Link to="/">← Back to Table Selection</Link>
          </Button>
        </div>
      </div>
    </main>
  );
};

export default StaffLoginPage;
