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
  onPasswordResetRequired?: () => void;
}

export const StaffLoginForm = ({ onSuccess, onPasswordResetRequired }: StaffLoginFormProps) => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { loginAsStaffUser } = useAuth();
  const router = useRouter();

  const redirectUserToTheirArea = useCallback((role?: string) => {
    if (role === "admin") {
      router.push("/admin");
      return;
    }
    if (role === "manager") {
      router.push("/manager");
      return;
    }
    router.push("/kitchen");
  }, [router]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");

      if (!identifier || !password) {
        setError("Username/email and password are required");
        return;
      }

      setIsLoading(true);

      try {
        const result = await loginAsStaffUser(identifier, password);

        if (!result.success) {
          setError(result.error || "Login failed. Please check your credentials.");
          return;
        }

        const passwordIsReseted = result.passwordResetRequired && !result.skipPasswordResetReminder;

        if (passwordIsReseted) {
          onPasswordResetRequired?.();
          onSuccess?.();
          redirectUserToTheirArea(result.role);
          return;
        }

        onSuccess?.();
        redirectUserToTheirArea(result.role);
      } catch {
        setError("An error occurred. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [identifier, password, loginAsStaffUser, onPasswordResetRequired, onSuccess, redirectUserToTheirArea],
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="staff-identifier" className="text-sm font-medium text-foreground block">
          Username or Email
        </label>
        <Input
          id="staff-identifier"
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="username or your@email.com"
          className="w-full"
          autoFocus
          disabled={isLoading}
        />
      </div>

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
            placeholder="Your password"
            className="w-full pr-10"
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
        Enter your staff username or email and password to access your portal.
      </p>
    </form>
  );
};

export default StaffLoginForm;
