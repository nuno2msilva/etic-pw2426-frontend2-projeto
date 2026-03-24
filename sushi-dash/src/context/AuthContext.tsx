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
    /** Dismiss password reset reminder for this session only (show again on next login) */
    remindMeLater: () => void;
  /** Password reset flag from login */
  passwordResetRequired: boolean;
  /** User explicitly skipped reminder */
  skipPasswordResetReminder: boolean;
    /** User dismissed reminder this session (gets reset on next login) */
    passwordChangeReminderDismissedThisSession: boolean;
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

function normalizeStaffRole(value?: string): AuthRole | undefined {
  if (!value) return undefined;
  const normalized = value.toLowerCase();
  if (normalized === 'customer' || normalized === 'kitchen' || normalized === 'manager' || normalized === 'admin') {
    return normalized;
  }
  return undefined;
}

function normalizePermission(value?: string): 'kitchen' | 'manager' | 'admin' | undefined {
  if (!value) return undefined;
  const normalized = value.toLowerCase();
  if (normalized === 'kitchen' || normalized === 'manager' || normalized === 'admin') {
    return normalized;
  }
  return undefined;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [customerSession, setCustomerSession] = useState<AuthSession | null>(null);
  const [staffSession, setStaffSession] = useState<AuthSession | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [passwordResetRequired, setPasswordResetRequired] = useState(false);
  const [skipPasswordResetReminder, setSkipPasswordResetReminder] = useState(false);
    const [passwordChangeReminderDismissedThisSession, setPasswordChangeReminderDismissedThisSession] = useState(false);
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
        const normalizedRole = normalizeStaffRole(existingStaff.role);
        const normalizedPermission = normalizePermission(existingStaff.permission ?? existingStaff.role);
        if (normalizedRole && normalizedRole !== 'customer') {
          const normalizedStaffSession: AuthSession = {
            ...existingStaff,
            role: normalizedRole,
            permission: normalizedPermission,
          };
          saveAuthSession(normalizedStaffSession);
          setStaffSession(normalizedStaffSession);
          setPasswordResetRequired(normalizedStaffSession.passwordResetRequired ?? false);
          setSkipPasswordResetReminder(normalizedStaffSession.skipPasswordResetReminder ?? false);
        }
      }
      if (existingCustomer || existingStaff) invalidateAllCaches();
      setIsInitialized(true);
    };
    init();
  }, [invalidateAllCaches]);

  // Periodically validate staff session server-side so admin actions (e.g. password reset)
  // can force immediate logout on connected clients.
  useEffect(() => {
    if (!isInitialized || !staffSession) return;

    let cancelled = false;

    const validateSession = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/session`, {
          credentials: 'include',
        });
        if (!res.ok) return;

        const data = await res.json() as {
          authenticated?: boolean;
          sessions?: Array<{ role?: string; authenticated?: boolean }>;
        };
        const hasStaffSession = Array.isArray(data.sessions)
          ? data.sessions.some((s) => s.role !== 'customer' && s.authenticated)
          : false;

        if (!cancelled && !hasStaffSession) {
          clearAuthSession('staff');
          setStaffSession(null);
          setPasswordResetRequired(false);
          setSkipPasswordResetReminder(false);
          setPasswordChangeReminderDismissedThisSession(false);
          queryClient.invalidateQueries();
        }
      } catch {
        // Best-effort polling: ignore transient network errors.
      }
    };

    validateSession();
    const timer = setInterval(validateSession, 5000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [isInitialized, staffSession, queryClient]);

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
        const normalizedRole = normalizeStaffRole(result.role);
        const normalizedPermission = normalizePermission(result.permission ?? result.role);
        if (!normalizedRole || normalizedRole === 'customer') {
          return { success: false, error: 'Invalid staff role received from server' };
        }
        const newSession: AuthSession = {
          role: normalizedRole,
          userId: result.userId,
          email: result.email,
          username: result.username ?? null,
          permission: normalizedPermission,
          authenticatedAt: Date.now(),
          passwordResetRequired: result.passwordResetRequired ?? false,
          skipPasswordResetReminder: result.skipPasswordResetReminder ?? false,
        };
        saveAuthSession(newSession);
        setStaffSession(newSession);
        setPasswordResetRequired(result.passwordResetRequired ?? false);
        setSkipPasswordResetReminder(result.skipPasswordResetReminder ?? false);
          // Reset session-level dismissal on each login (will show reminder again)
          setPasswordChangeReminderDismissedThisSession(false);
        invalidateAllCaches();
        return {
          success: true,
          role: normalizedRole,
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
        setPasswordChangeReminderDismissedThisSession(false);
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

    const remindMeLater = useCallback(() => {
      // Dismiss reminder for this session only (will show again on next login)
      setPasswordChangeReminderDismissedThisSession(true);
    }, []);

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
    setPasswordChangeReminderDismissedThisSession(false);
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
      remindMeLater,
    passwordResetRequired,
    skipPasswordResetReminder,
      passwordChangeReminderDismissedThisSession,
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
