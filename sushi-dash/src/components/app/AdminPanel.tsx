// AdminPanel — User management interface for admin staff

'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Lock, Unlock, Plus, RotateCcw, Pencil } from 'lucide-react';
import { API_BASE } from '@/lib/config';
import type { Permission } from '@/lib/auth';

interface User {
  id: number;
  email: string;
  username: string;
  passwordPreview: string | null;
  permission: Permission;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const AdminPanel = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Add user form
  const [newUsername, setNewUsername] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPermission, setNewUserPermission] = useState<Permission | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit user form
  const [editUsername, setEditUsername] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserPermission, setEditUserPermission] = useState<Permission>('kitchen');

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/users`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      } else {
        toast.error('Failed to load users');
      }
    } catch (err) {
      toast.error('Network error while loading users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newUsername || !newUserEmail) {
      toast.error('Username and email are required');
      return;
    }

    if (!validateEmail(newUserEmail)) {
      toast.error('Invalid email format');
      return;
    }

    if (!newUserPermission) {
      toast.error('Permission level is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/api/users`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUsername,
          email: newUserEmail,
          permission: newUserPermission,
        }),
      });

      if (res.ok) {
        toast.success(`User ${newUsername} created. Random password generated.`);
        setNewUsername('');
        setNewUserEmail('');
        setNewUserPermission('');
        setShowAddDialog(false);
        fetchUsers();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to create user');
      }
    } catch (err) {
      toast.error('Network error while creating user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setEditUsername(user.username);
    setEditUserEmail(user.email);
    setEditUserPermission(user.permission);
    setShowEditDialog(true);
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUser) return;

    if (!editUsername) {
      toast.error('Username is required');
      return;
    }

    if (!editUserEmail) {
      toast.error('Email is required');
      return;
    }

    if (!validateEmail(editUserEmail)) {
      toast.error('Invalid email format');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/api/users/${selectedUser.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: editUsername,
          email: editUserEmail,
          permission: editUserPermission,
        }),
      });

      if (res.ok) {
        toast.success(`User ${editUserEmail} updated successfully`);
        setShowEditDialog(false);
        setSelectedUser(null);
        fetchUsers();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to update user');
      }
    } catch (_err) {
      toast.error('Network error while updating user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) {
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/api/users/${selectedUser.id}/reset-password`, {
        method: 'PATCH',
        credentials: 'include',
      });

      if (res.ok) {
        toast.success(`Password reset for ${selectedUser.email}. Random password generated.`);
        setShowResetDialog(false);
        fetchUsers();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to reset password');
      }
    } catch (err) {
      toast.error('Network error while resetting password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      const endpoint = user.isActive ? 'disable' : 'enable';
      const res = await fetch(`${API_BASE}/api/users/${user.id}/${endpoint}`, {
        method: 'PATCH',
        credentials: 'include',
      });

      if (res.ok) {
        toast.success(`User ${user.isActive ? 'disabled' : 'enabled'}`);
        fetchUsers();
      } else {
        toast.error('Failed to update user status');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/api/users/${selectedUser.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (res.ok) {
        toast.success(`User ${selectedUser.email} deleted`);
        setShowDeleteDialog(false);
        setSelectedUser(null);
        fetchUsers();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to delete user');
      }
    } catch (err) {
      toast.error('Network error while deleting user');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="p-6 text-center text-muted-foreground">Loading users...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">👥 User Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage staff users, permissions, and passwords
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add User
        </Button>
      </div>

      {/* Users Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Username</th>
                <th className="text-left px-4 py-3 font-medium">Email</th>
                <th className="text-left px-4 py-3 font-medium">Password</th>
                <th className="text-left px-4 py-3 font-medium">Permission</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b hover:bg-muted/50">
                  <td className="px-4 py-3">{user.username}</td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3 font-mono text-sm">
                    {user.passwordPreview ? (
                      <span className="inline-flex rounded border bg-muted px-2 py-1 font-semibold tracking-wider">
                        {user.passwordPreview}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Not visible after first login</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        user.permission === 'admin'
                          ? 'default'
                          : user.permission === 'manager'
                          ? 'secondary'
                          : 'outline'
                      }
                    >
                      {user.permission}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={user.isActive ? 'outline' : 'destructive'}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditDialog(user)}
                        title="Edit user"
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowResetDialog(true);
                        }}
                        title="Reset password"
                        className="h-8 w-8 p-0"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleActive(user)}
                        title={user.permission === 'admin' ? 'Admin users cannot be disabled' : user.isActive ? 'Disable' : 'Enable'}
                        className="h-8 w-8 p-0"
                        disabled={user.permission === 'admin'}
                      >
                        {user.isActive ? (
                          <Lock className="w-4 h-4" />
                        ) : (
                          <Unlock className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowDeleteDialog(true);
                        }}
                        title={user.permission === 'admin' ? 'Admin users cannot be deleted' : 'Delete'}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        disabled={user.permission === 'admin'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user account details and permission</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditUser} className="space-y-4">
            <div>
              <Label htmlFor="edit-username" className="text-sm">
                Username
              </Label>
              <Input
                id="edit-username"
                type="text"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                disabled={isSubmitting}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="edit-email" className="text-sm">
                Email
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={editUserEmail}
                onChange={(e) => setEditUserEmail(e.target.value)}
                disabled={isSubmitting}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="edit-permission" className="text-sm">
                Permission Level
              </Label>
              <Select value={editUserPermission} onValueChange={(v) => setEditUserPermission(v as Permission)}>
                <SelectTrigger id="edit-permission" className="mt-1.5">
                  <SelectValue placeholder="Select a permission level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kitchen">Kitchen</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new staff user account. A random password will be generated automatically.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddUser} className="space-y-4">
            <div>
              <Label htmlFor="username" className="text-sm">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="chef_bruno"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                disabled={isSubmitting}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-sm">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="user@sushidash.dev"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                disabled={isSubmitting}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="permission" className="text-sm">
                Permission Level
              </Label>
              <Select value={newUserPermission} onValueChange={(v) => setNewUserPermission(v as Permission)}>
                <SelectTrigger id="permission" className="mt-1.5">
                  <SelectValue placeholder="Select a permission level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kitchen">Kitchen</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? 'Creating...' : 'Create User'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddDialog(false)}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Generate a new random password for {selectedUser?.email}. They will be prompted to change it on next login.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleResetPassword();
            }}
            className="space-y-4"
          >
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? 'Generating...' : 'Generate Password'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowResetDialog(false)}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedUser?.email}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={isSubmitting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
