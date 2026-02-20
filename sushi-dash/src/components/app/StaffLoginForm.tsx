// StaffLoginForm — Shared staff login form with password entry, visibility toggle, and auto-routing on success.

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Eye, EyeOff } from "lucide-react";

interface StaffLoginFormProps {
  onSuccess?: () => void;
}

export const StaffLoginForm = ({ onSuccess }: StaffLoginFormProps) => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { loginAsKitchen, loginAsManager } = useAuth();
  const router = useRouter();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      setIsLoading(true);

      try {
        const isManager = await loginAsManager(password);
        if (isManager) {
          onSuccess?.();
          router.push("/manager");
          return;
        }

        const isKitchen = await loginAsKitchen(password);
        if (isKitchen) {
          onSuccess?.();
          router.push("/kitchen");
          return;
        }

        setError("Invalid password. Please try again.");
      } catch {
        setError("An error occurred. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [password, loginAsKitchen, loginAsManager, router, onSuccess]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label
          htmlFor="staff-password"
          className="text-sm font-medium text-foreground block"
        >
          Password
        </label>
        <div className="relative">
          <Input
            id="staff-password"
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
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
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

      <p className="text-xs text-muted-foreground text-center">
        Your password determines your access level automatically.
      </p>
    </form>
  );
};

export default StaffLoginForm;
