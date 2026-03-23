// AuthContext — dual-session auth (customer PIN + staff password) with role-based access control.

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { API_BASE } from '@/lib/config';
import {
  AuthSession,
  AuthRole,
  getAuthSession,
  saveAuthSession,
  clearAuthSession,
  loginTableWithPin,
  loginAsStaff,
  changePassword as changePasswordApi,
  skipPasswordResetReminder as skipPasswordResetReminderApi,
  hasAccess,
} from '@/lib/auth';

interface AuthContextType {
  /** Current customer session (if any) */
  customerSession: AuthSession | null;
  /** Current staff session (if any) */
  staffSession: AuthSession | null;
  /** Combined "primary" session for backwards compat (staff > customer) */
  session: AuthSession | null;
  /** Whether auth system is initialized */
  isInitialized: boolean;
  /** Whether user has any active session */
  isAuthenticated: boolean;
  /** Login as customer for a specific table (4-digit PIN) */
  loginAsCustomer: (tableId: string, pin: string) => Promise<boolean>;
  /** Login as staff (username/email + password) — kitchen, manager, or admin */
  loginAsStaffUser: (
    identifier: string,
    password: string,
  ) => Promise<{
    success: boolean;
    role?: AuthRole;
    passwordResetRequired?: boolean;
    skipPasswordResetReminder?: boolean;
    error?: string;
  }>;
  /** Change own password (staff only) */
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  /** Skip password reset reminder (user opts out of reset prompt) */
  skipResetReminder: () => void;
  /** Password reset flag from login */
  passwordResetRequired: boolean;
  /** User explicitly skipped reminder */
  skipPasswordResetReminder: boolean;
  /** Logout — clears customer session only (for SSE ejection) */
  logout: () => void;
  /** Logout staff session (kitchen/manager) */
  logoutStaff: () => void;
  /** Check if current session has access to a role/table */
  checkAccess: (requiredRole: AuthRole, tableId?: string) => boolean;
  /** Get the authenticated table ID (from customer session) */
  authenticatedTableId: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

function getErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return fallback;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [customerSession, setCustomerSession] = useState<AuthSession | null>(null);
  const [staffSession, setStaffSession] = useState<AuthSession | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [passwordResetRequired, setPasswordResetRequired] = useState(false);
  const [skipPasswordResetReminder, setSkipPasswordResetReminder] = useState(false);
  const queryClient = useQueryClient();

  const invalidateAllCaches = useCallback(() => {
    queryClient.invalidateQueries();
  }, [queryClient]);

  // Initialize auth system on mount — restore both sessions
  useEffect(() => {
    const init = async () => {
      const existingCustomer = getAuthSession('customer');
      const existingStaff = getAuthSession('staff');
      if (existingCustomer) setCustomerSession(existingCustomer);
      if (existingStaff) {
        setStaffSession(existingStaff);
        setPasswordResetRequired(existingStaff.passwordResetRequired ?? false);
        setSkipPasswordResetReminder(existingStaff.skipPasswordResetReminder ?? false);
      }
      if (existingCustomer || existingStaff) invalidateAllCaches();
      setIsInitialized(true);
    };
    init();
  }, [invalidateAllCaches]);

  const loginAsCustomer = useCallback(async (tableId: string, pin: string): Promise<boolean> => {
    const success = await loginTableWithPin(tableId, pin);
    if (success) {
      const newSession: AuthSession = {
        role: 'customer',
        tableId,
        authenticatedAt: Date.now(),
      };
      saveAuthSession(newSession);
      setCustomerSession(newSession);
      invalidateAllCaches();
      return true;
    }
    return false;
  }, [invalidateAllCaches]);

  const loginAsStaffUser = useCallback(async (
    identifier: string,
    password: string
  ): Promise<{
    success: boolean;
    role?: AuthRole;
    passwordResetRequired?: boolean;
    skipPasswordResetReminder?: boolean;
    error?: string;
  }> => {
    try {
      const result = await loginAsStaff(identifier, password);
      if (result.success && result.role) {
        const newSession: AuthSession = {
          role: result.role as AuthRole,
          userId: result.userId,
          email: result.email,
          username: result.username ?? null,
          permission: result.permission,
          authenticatedAt: Date.now(),
          passwordResetRequired: result.passwordResetRequired ?? false,
          skipPasswordResetReminder: result.skipPasswordResetReminder ?? false,
        };
        saveAuthSession(newSession);
        setStaffSession(newSession);
        setPasswordResetRequired(result.passwordResetRequired ?? false);
        setSkipPasswordResetReminder(result.skipPasswordResetReminder ?? false);
        invalidateAllCaches();
        return {
          success: true,
          role: result.role,
          passwordResetRequired: result.passwordResetRequired ?? false,
          skipPasswordResetReminder: result.skipPasswordResetReminder ?? false,
        };
      }
      return { success: false, error: result.error ?? 'Login failed' };
    } catch (err) {
      return { success: false, error: getErrorMessage(err, 'Login failed') };
    }
  }, [invalidateAllCaches]);

  const changePassword = useCallback(async (
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await changePasswordApi(currentPassword, newPassword);
      if (result.success) {
        // Clear password reset flags once user changes password
        setPasswordResetRequired(false);
        setSkipPasswordResetReminder(false);
        const updated = staffSession ? { ...staffSession, passwordResetRequired: false, skipPasswordResetReminder: false } : null;
        if (updated) {
          saveAuthSession(updated);
          setStaffSession(updated);
        }
        invalidateAllCaches();
        return { success: true };
      }
      return { success: false, error: result.error ?? 'Password change failed' };
    } catch (err) {
      return { success: false, error: getErrorMessage(err, 'Password change failed') };
    }
  }, [staffSession, invalidateAllCaches]);

  const skipResetReminder = useCallback(() => {
    setSkipPasswordResetReminder(true);
    skipPasswordResetReminderApi().catch(() => {});
    const updated = staffSession ? { ...staffSession, skipPasswordResetReminder: true } : null;
    if (updated) {
      saveAuthSession(updated);
      setStaffSession(updated);
    }
  }, [staffSession]);
  /** Logout customer session — used by SSE ejection */
  const logout = useCallback(() => {
    clearAuthSession('customer');
    setCustomerSession(null);
    fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'customer' }),
    }).catch(() => {});
    queryClient.invalidateQueries();
  }, [queryClient]);

  /** Logout staff session */
  const logoutStaff = useCallback(() => {
    clearAuthSession('staff');
    setStaffSession(null);
    setPasswordResetRequired(false);
    setSkipPasswordResetReminder(false);
    fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: staffSession?.role ?? 'manager' }),
    }).catch(() => {});
    queryClient.invalidateQueries();
  }, [queryClient, staffSession?.role]);

  // Combined session for backwards compat (staff takes priority)
  const session = staffSession ?? customerSession;

  const checkAccess = useCallback((requiredRole: AuthRole, tableId?: string): boolean => {
    // Check staff session first (higher privilege)
    if (staffSession && hasAccess(staffSession, requiredRole, tableId)) return true;
    // Then customer session
    if (customerSession && hasAccess(customerSession, requiredRole, tableId)) return true;
    return false;
  }, [staffSession, customerSession]);

  const authenticatedTableId = customerSession?.tableId ?? null;

  const value: AuthContextType = {
    customerSession,
    staffSession,
    session,
    isInitialized,
    isAuthenticated: session !== null,
    loginAsCustomer,
    loginAsStaffUser,
    changePassword,
    skipResetReminder,
    passwordResetRequired,
    skipPasswordResetReminder,
    logout,
    logoutStaff,
    checkAccess,
    authenticatedTableId,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
