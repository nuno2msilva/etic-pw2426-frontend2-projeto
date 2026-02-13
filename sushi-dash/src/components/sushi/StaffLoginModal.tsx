/**
 * StaffLoginModal.tsx
 * ---------------------------------------------------------------------------
 * Modal dialog for staff login (kitchen / manager). Replaces the old
 * dedicated StaffLoginPage. Shows a password field with an eye toggle,
 * auto-routes to /kitchen or /manager on success.
 *
 * Props:
 * @prop {boolean}  isOpen   — Controls dialog visibility.
 * @prop {Function} onClose  — Called when the dialog should close.
 * ---------------------------------------------------------------------------
 */

import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, Eye, EyeOff } from "lucide-react";

interface StaffLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StaffLoginModal = ({ isOpen, onClose }: StaffLoginModalProps) => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { loginAsKitchen, loginAsManager } = useAuth();
  const navigate = useNavigate();

  const reset = () => {
    setPassword("");
    setShowPassword(false);
    setError("");
    setIsLoading(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      reset();
      onClose();
    }
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      setIsLoading(true);

      try {
        const isManager = await loginAsManager(password);
        if (isManager) {
          reset();
          onClose();
          navigate("/manager");
          return;
        }

        const isKitchen = await loginAsKitchen(password);
        if (isKitchen) {
          reset();
          onClose();
          navigate("/kitchen");
          return;
        }

        setError("Invalid password. Please try again.");
      } catch {
        setError("An error occurred. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [password, loginAsKitchen, loginAsManager, navigate, onClose]
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>🔐 Staff Login</DialogTitle>
        </DialogHeader>

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
      </DialogContent>
    </Dialog>
  );
};

export default StaffLoginModal;
