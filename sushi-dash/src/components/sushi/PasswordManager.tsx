/**
 * PasswordManager.tsx
 * ---------------------------------------------------------------------------
 * Manager-only card that lets the admin change the Kitchen and Manager
 * passwords. Renders a tabbed interface (Kitchen / Manager) using
 * shadcn/ui Tabs, each containing a `SinglePasswordSection` sub-component.
 *
 * Features:
 * - Two tabs for each protected role (Kitchen, Manager).
 * - Password confirmation required only for the Manager tab.
 * - Minimum 4-character validation.
 * - Calls `updateKitchenPassword` / `updateManagerPassword` from lib/auth
 *   which hashes with SHA-256 and stores in localStorage.
 * - Toast notifications for success/error feedback.
 *
 * Table passwords were removed — tables are now accessed directly via URL.
 *
 * Used in: ManagerPage (Security section)
 * ---------------------------------------------------------------------------
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Key, 
  AlertCircle,
  ChefHat,
  Shield,
} from 'lucide-react';
import { 
  updateKitchenPassword, 
  updateManagerPassword,
} from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
export function PasswordManager() {
  const { toast } = useToast();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Password Management
        </CardTitle>
        <CardDescription>
          Manage passwords for kitchen and manager access
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="kitchen" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="kitchen" className="flex items-center gap-1">
              <ChefHat className="h-4 w-4" />
              Kitchen
            </TabsTrigger>
            <TabsTrigger value="manager" className="flex items-center gap-1">
              <Shield className="h-4 w-4" />
              Manager
            </TabsTrigger>
          </TabsList>

          <TabsContent value="kitchen" className="mt-4">
            <SinglePasswordSection
              title="Kitchen Password"
              description="Password for kitchen staff to access the order dashboard"
              onSave={updateKitchenPassword}
              toast={toast}
            />
          </TabsContent>

          <TabsContent value="manager" className="mt-4">
            <SinglePasswordSection
              title="Manager Password"
              description="Password for manager access. Be careful when changing this!"
              onSave={updateManagerPassword}
              toast={toast}
              isManager
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

interface SinglePasswordSectionProps {
  title: string;
  description: string;
  onSave: (password: string) => Promise<void>;
  toast: ReturnType<typeof useToast>['toast'];
  isManager?: boolean;
}

function SinglePasswordSection({ 
  title, 
  description, 
  onSave, 
  toast,
  isManager = false 
}: SinglePasswordSectionProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);

    if (!password.trim()) {
      setError('Please enter a password');
      return;
    }

    if (password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }

    if (isManager && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(password);
      toast({
        title: 'Password Updated',
        description: `${title} has been updated successfully`,
      });
      setPassword('');
      setConfirmPassword('');
    } catch {
      setError('Failed to update password');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{description}</p>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor={`${title}-password`}>New Password</Label>
          <Input
            id={`${title}-password`}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter new password"
          />
        </div>

        {isManager && (
          <div className="space-y-2">
            <Label htmlFor={`${title}-confirm`}>Confirm Password</Label>
            <Input
              id={`${title}-confirm`}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
          </div>
        )}

        <Button onClick={handleSave} disabled={isSaving} className="w-full">
          {isSaving ? 'Saving...' : 'Update Password'}
        </Button>
      </div>
    </div>
  );
}
