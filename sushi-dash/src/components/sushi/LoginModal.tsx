/**
 * LoginModal.tsx
 * ---------------------------------------------------------------------------
 * Reusable password dialog used to gate access to the Kitchen and Manager
 * pages. Built on top of shadcn/ui Dialog, it provides:
 *
 * - A form with a password input and submit button.
 * - Loading state while the async `onLogin` callback runs.
 * - Error feedback when the wrong password is entered.
 * - Optional "closeable" mode: when false the modal cannot be dismissed
 *   with Escape or clicking outside, forcing the user to authenticate.
 *
 * Props:
 * @prop {boolean}  isOpen       — Whether the dialog is visible.
 * @prop {string}   title        — Dialog title (e.g. "Kitchen Access").
 * @prop {string}   description  — Helper text below the title.
 * @prop {string}   placeholder  — Input placeholder text (default "Enter password").
 * @prop {Function} onLogin      — Async callback receiving the password string,
 *                                  returns `true` on success.
 * @prop {Function} onClose      — Called when the dialog is dismissed (only if closeable).
 * @prop {boolean}  closeable    — Whether the dialog can be closed without logging in.
 *
 * Used in: KitchenPage, ManagerPage
 * ---------------------------------------------------------------------------
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, AlertCircle, Loader2 } from 'lucide-react';

interface LoginModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Title for the login modal */
  title: string;
  /** Description text */
  description: string;
  /** Placeholder for password input */
  placeholder?: string;
  /** Callback when login is attempted */
  onLogin: (password: string) => Promise<boolean>;
  /** Optional callback when modal is closed (if closeable) */
  onClose?: () => void;
  /** Whether the modal can be closed without logging in */
  closeable?: boolean;
}

export function LoginModal({
  isOpen,
  title,
  description,
  placeholder = 'Enter password',
  onLogin,
  onClose,
  closeable = false,
}: LoginModalProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setError('Please enter a password');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const success = await onLogin(password);
      if (!success) {
        setError('Invalid password. Please try again.');
        setPassword('');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && closeable && onClose) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent 
        className="sm:max-w-md"
        onPointerDownOutside={(e) => !closeable && e.preventDefault()}
        onEscapeKeyDown={(e) => !closeable && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-orange-500" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={placeholder}
              autoFocus
              disabled={isLoading}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            {closeable && onClose && (
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Login'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
