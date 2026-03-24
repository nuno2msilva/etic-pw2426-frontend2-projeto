// PasswordChangeModal — Required password change dialog for staff users after admin resets password

import { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';

interface PasswordChangeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  showReminderActions?: boolean;
}

export const PasswordChangeModal = ({
  open,
  onOpenChange,
  onSuccess,
  showReminderActions = false,
}: PasswordChangeModalProps) => {
  const { changePassword, skipResetReminder, remindMeLater } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(!showReminderActions);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (open) {
      setShowForm(!showReminderActions);
    }
  }, [open, showReminderActions]);

  const validatePassword = (password: string): { valid: boolean; error?: string } => {
    if (password.length < 8) {
      return { valid: false, error: 'Password must be at least 8 characters' };
    }
    if (!/\d/.test(password)) {
      return { valid: false, error: 'Password must contain at least one number' };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, error: 'Password must contain at least one uppercase letter' };
    }
    return { valid: true };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setIsLoading(true);
    const result = await changePassword(currentPassword, newPassword);

    if (result.success) {
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      onOpenChange(false);
      onSuccess?.();
    } else {
      toast.error(result.error || 'Failed to change password');
    }

    setIsLoading(false);
  };

  const handleRemindMeLater = () => {
    remindMeLater();
    onOpenChange(false);
  };

  const handleSkipReminder = () => {
    skipResetReminder();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>🔐 Change Password Required</DialogTitle>
          <DialogDescription className="text-sm mt-2">
            An administrator has reset your password. Please change it to a new one.
          </DialogDescription>
        </DialogHeader>

        {!showForm && showReminderActions && (
          <div className="space-y-4">
            <DialogDescription className="text-sm">
              Your password is still temporary. Choose what you want to do now.
            </DialogDescription>
            <div className="grid grid-cols-3 gap-2 pt-2">
              <Button type="button" onClick={() => setShowForm(true)}>
                Change Now
              </Button>
              <Button type="button" variant="outline" onClick={handleRemindMeLater}>
                Remind Later
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleSkipReminder}
                className="text-destructive hover:text-destructive"
              >
                Don't Remind
              </Button>
            </div>
          </div>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="current-password" className="text-sm">
              Current Password
            </Label>
            <div className="relative mt-1.5">
              <Input
                id="current-password"
                type={showCurrentPassword ? 'text' : 'password'}
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={isLoading}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
                aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="new-password" className="text-sm">
              New Password
            </Label>
            <div className="relative mt-1.5">
              <Input
                id="new-password"
                type={showNewPassword ? 'text' : 'password'}
                placeholder="At least 8 chars, 1 number, 1 uppercase"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
                aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="confirm-password" className="text-sm">
              Confirm New Password
            </Label>
            <div className="relative mt-1.5">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-4">
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Changing...' : 'Change Now'}
            </Button>
            {showReminderActions ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
                disabled={isLoading}
              >
                Back
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={handleRemindMeLater}
              disabled={isLoading}
            >
              Remind Later
            </Button>
          </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
