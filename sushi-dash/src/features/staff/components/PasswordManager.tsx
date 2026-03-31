// PasswordManager — Deprecated legacy component kept for compatibility.

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Key } from 'lucide-react';

export function PasswordManager() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Password Management
        </CardTitle>
        <CardDescription>
          Passwords are now managed per user account by administrators.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Use the account menu to change your own password, or ask an admin to reset a staff user password.
        </p>
      </CardContent>
    </Card>
  );
}
