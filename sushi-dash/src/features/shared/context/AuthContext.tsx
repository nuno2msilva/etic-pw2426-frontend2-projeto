// AuthContext — dual-session auth (customer PIN + staff password) with role-based access control.

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API_BASE } from '@/features/shared/lib/config';
import {
  CUSTOMER_SESSION_GRACE_PERIOD_MS,
  CUSTOMER_PRESENCE_HEARTBEAT_INTERVAL_MS,
  STAFF_SESSION_VALIDATION_INTERVAL_MS,
  CUSTOMER_SESSION_VALIDATION_INTERVAL_MS,
} from '@/features/shared/lib/timeouts';
import { sendPresenceHeartbeat, clearPresenceHeartbeat } from '@/features/shared/lib/api';
import { customerEvents, staffEvents } from '@/features/shared/lib/analytics';
import {
  AuthSession,
  AuthRole,
  normalizeAuthRole,
  normalizePermission,
  getAuthSession,
  saveAuthSession,
  clearAuthSession,
  loginTableWithPin,
  loginAsStaff,
  changePassword as changePasswordApi,
  skipPasswordResetReminder as skipPasswordResetReminderApi,
  hasAccess,
} from '@/features/shared/lib/auth';

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
  logout: () => Promise<void>;
  /** Logout staff session (kitchen/manager) */
  logoutStaff: () => Promise<void>;
  /** Check if current session has access to a role/table */
  checkAccess: (requiredRole: AuthRole, tableId?: string) => boolean;
  /** Get the authenticated table ID (from customer session) */
  authenticatedTableId: string | null;
  /** Whether customer is currently viewing table selection (closes SSE without logout) */
  isViewingTableSelection: boolean;
  /** Signal that customer is leaving the table (going to table selection). Logs out customer for accurate presence. */
  goToTableSelection: () => void;
  /** Signal that customer has selected a table. Re-enables SSE presence tracking. */
  goToTable: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const CUSTOMER_LAST_SEEN_AT_KEY = 'sushi-dash-customer-last-seen-at';

function getCustomerLastSeenAt(): number {
  if (typeof window === 'undefined') return NaN;
  const raw = window.sessionStorage.getItem(CUSTOMER_LAST_SEEN_AT_KEY);
  return raw ? Number(raw) : NaN;
}

function setCustomerLastSeenAt(value: number): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(CUSTOMER_LAST_SEEN_AT_KEY, String(value));
}

function clearCustomerLastSeenAt(): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(CUSTOMER_LAST_SEEN_AT_KEY);
}

type SessionSnapshot = {
  authenticated?: boolean;
  role?: string;
  userId?: number | null;
  email?: string;
  username?: string | null;
  tableId?: number | null;
  sessions?: Array<{ role?: string; tableId?: number | null; authenticated?: boolean }>;
};

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
    const [passwordChangeReminderDismissedThisSession, setPasswordChangeReminderDismissedThisSession] = useState(false);
  const [isViewingTableSelection, setIsViewingTableSelection] = useState(false);
  
  const invalidateAllCaches = useCallback(() => {
    // Intentionally empty: auth no longer depends on react-query at startup.
  }, []);

  const sendLogoutRequest = useCallback((role: 'customer' | AuthRole, keepalive = false) => {
    return fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      keepalive,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    }).catch(() => {});
  }, []);

  const fetchSessionSnapshot = useCallback(async (): Promise<SessionSnapshot | null> => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/session`, {
        credentials: 'include',
      });
      if (!res.ok) return null;
      return await res.json() as SessionSnapshot;
    } catch {
      return null;
    }
  }, []);

  const userIsLoggedOffFromStaffSession = useCallback(() => {
    clearAuthSession('staff');
    setStaffSession(null);
    setPasswordResetRequired(false);
    setSkipPasswordResetReminder(false);
    setPasswordChangeReminderDismissedThisSession(false);
  }, []);

  const userIsLoggedOffFromCustomerSession = useCallback(() => {
    clearAuthSession('customer');
    clearCustomerLastSeenAt();
    setCustomerSession(null);
    setIsViewingTableSelection(true);
  }, []);

  // Initialize auth system on mount — restore both sessions
  useEffect(() => {
    const init = async () => {
      const existingCustomer = getAuthSession('customer');
      const existingStaff = getAuthSession('staff');
      if (existingCustomer) {
        const lastSeenAt = getCustomerLastSeenAt();
        const hasRecentPresence = Number.isNaN(lastSeenAt)
          ? true
          : Date.now() - lastSeenAt <= CUSTOMER_SESSION_GRACE_PERIOD_MS;

        if (hasRecentPresence) {
          setCustomerSession(existingCustomer);
          setCustomerLastSeenAt(Date.now());
        } else {
          clearAuthSession('customer');
          sendLogoutRequest('customer');
        }
      }
      if (existingStaff) {
        const normalizedRole = normalizeAuthRole(existingStaff.role);
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
  }, [invalidateAllCaches, sendLogoutRequest]);

  // Keep a customer heartbeat so quick refreshes restore, while long disconnects (>5 min) expire naturally.
  useEffect(() => {
    if (!customerSession) return;

    const markCustomerPresence = () => {
      setCustomerLastSeenAt(Date.now());
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        markCustomerPresence();
      }
    };

    markCustomerPresence();
    const timer = setInterval(markCustomerPresence, CUSTOMER_PRESENCE_HEARTBEAT_INTERVAL_MS);
    window.addEventListener('focus', markCustomerPresence);
    window.addEventListener('pagehide', markCustomerPresence);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', markCustomerPresence);
      window.removeEventListener('pagehide', markCustomerPresence);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [customerSession]);

  // Send DB-backed heartbeat to server so presence works on Vercel serverless.
  // AbortController ensures any in-flight heartbeat fetch is cancelled when the effect
  // cleans up (logout/leave), preventing a race where a pending POST overwrites the clear.
  useEffect(() => {
    if (!customerSession?.tableId || isViewingTableSelection) return;

    const tableId = customerSession.tableId;
    const controller = new AbortController();

    // Send immediately
    void sendPresenceHeartbeat(tableId, controller.signal);

    // Then every 30 seconds
    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      void sendPresenceHeartbeat(tableId, controller.signal);
    }, CUSTOMER_PRESENCE_HEARTBEAT_INTERVAL_MS);

    return () => {
      controller.abort(); // cancel any in-flight heartbeat before clearPresenceHeartbeat fires
      clearInterval(timer);
      void clearPresenceHeartbeat(tableId); // proactively DELETE DB presence row on any teardown
    };
  }, [customerSession?.tableId, isViewingTableSelection]);

  // Periodically validate staff session server-side so admin actions (e.g. password reset)
  // can force immediate logout on connected clients.
  useEffect(() => {
    if (!isInitialized || !staffSession) return;

    let cancelled = false;

    const validateSession = async () => {
      try {
        const data = await fetchSessionSnapshot();
        if (!data) return;
        const ifUserIsLoggedInAsStaff = Array.isArray(data.sessions)
          ? data.sessions.some((s) => s.role !== 'customer' && s.authenticated)
          : false;

        if (!cancelled && !ifUserIsLoggedInAsStaff) {
          userIsLoggedOffFromStaffSession();
          invalidateAllCaches();
          return;
        }

        if (!cancelled && ifUserIsLoggedInAsStaff) {
          const serverRole = normalizeAuthRole(data.role);
          if (serverRole && serverRole !== 'customer') {
            const serverPermission = normalizePermission(serverRole);
            const shouldSyncSession =
              !staffSession ||
              staffSession.role !== serverRole ||
              (staffSession.userId ?? null) !== (data.userId ?? null) ||
              (staffSession.email ?? undefined) !== (data.email ?? undefined) ||
              (staffSession.username ?? null) !== (data.username ?? null);

            if (shouldSyncSession) {
              const syncedStaffSession: AuthSession = {
                ...(staffSession ?? {
                  authenticatedAt: Date.now(),
                  passwordResetRequired: false,
                  skipPasswordResetReminder: false,
                }),
                role: serverRole,
                permission: serverPermission,
                userId: data.userId ?? staffSession?.userId,
                email: data.email ?? staffSession?.email,
                username: data.username ?? staffSession?.username ?? null,
              };

              saveAuthSession(syncedStaffSession);
              setStaffSession(syncedStaffSession);
            }
          }
        }
      } catch {
        // Best-effort polling: ignore transient network errors.
      }
    };

    validateSession();
    const timer = setInterval(validateSession, STAFF_SESSION_VALIDATION_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [isInitialized, staffSession, fetchSessionSnapshot, invalidateAllCaches, userIsLoggedOffFromStaffSession]);

  // Periodically validate customer session server-side so PIN randomization
  // immediately ejects customers even if SSE transport is temporarily unavailable.
  useEffect(() => {
    if (!isInitialized || !customerSession?.tableId) return;

    let cancelled = false;

    const validateCustomerSession = async () => {
      try {
        const data = await fetchSessionSnapshot();
        if (!data) return;

        const customerSessionStillValid = Array.isArray(data.sessions)
          ? data.sessions.some(
              (s) =>
                s.role === 'customer' &&
                s.authenticated &&
                String(s.tableId ?? '') === customerSession.tableId,
            )
          : false;

        if (!cancelled && !customerSessionStillValid) {
          userIsLoggedOffFromCustomerSession();
          invalidateAllCaches();
        }
      } catch {
        // Best-effort polling: ignore transient network errors.
      }
    };

    validateCustomerSession();
    const timer = setInterval(validateCustomerSession, CUSTOMER_SESSION_VALIDATION_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [isInitialized, customerSession?.tableId, fetchSessionSnapshot, invalidateAllCaches, userIsLoggedOffFromCustomerSession]);

  const loginAsCustomer = useCallback(async (tableId: string, pin: string): Promise<boolean> => {
    // If switching tables, clear presence for the old table first
    const oldTableId = customerSession?.tableId;
    if (oldTableId && oldTableId !== tableId) {
      void clearPresenceHeartbeat(oldTableId);
    }
    const success = await loginTableWithPin(tableId, pin);
    customerEvents.pinEntered(tableId, success);
    if (success) {
      const newSession: AuthSession = {
        role: 'customer',
        tableId,
        authenticatedAt: Date.now(),
      };
      saveAuthSession(newSession);
      setCustomerSession(newSession);
      setCustomerLastSeenAt(Date.now());
      setIsViewingTableSelection(false);
      invalidateAllCaches();
      customerEvents.tableSelected(tableId);
      customerEvents.sessionStarted(tableId);
      return true;
    }
    return false;
  }, [customerSession?.tableId, invalidateAllCaches]);

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
        const normalizedRole = normalizeAuthRole(result.role);
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
        staffEvents.loginSucceeded(normalizedRole);
        return {
          success: true,
          role: normalizedRole,
          passwordResetRequired: result.passwordResetRequired ?? false,
          skipPasswordResetReminder: result.skipPasswordResetReminder ?? false,
        };
      }
      staffEvents.loginAttempted(identifier, false);
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
  const logout = useCallback(async () => {
    const tableId = customerSession?.tableId;
    const sessionDuration = customerSession?.authenticatedAt
      ? Math.round((Date.now() - customerSession.authenticatedAt) / 1000)
      : 0;
    clearAuthSession('customer');
    clearCustomerLastSeenAt();
    setCustomerSession(null);
    setIsViewingTableSelection(true);
    if (tableId) {
      void clearPresenceHeartbeat(tableId);
      customerEvents.sessionEnded(tableId, sessionDuration);
    }
    await sendLogoutRequest('customer');
    invalidateAllCaches();
  }, [customerSession?.tableId, customerSession?.authenticatedAt, invalidateAllCaches, sendLogoutRequest]);

  /** Logout staff session */
  const logoutStaff = useCallback(async () => {
    const role = staffSession?.role ?? 'manager';
    const sessionDuration = staffSession?.authenticatedAt
      ? Math.round((Date.now() - staffSession.authenticatedAt) / 1000)
      : 0;
    staffEvents.loggedOut(role, sessionDuration);
    userIsLoggedOffFromStaffSession();
    await sendLogoutRequest(role);
    invalidateAllCaches();
  }, [invalidateAllCaches, sendLogoutRequest, staffSession?.role, staffSession?.authenticatedAt, userIsLoggedOffFromStaffSession]);

  /** Signal that customer is browsing table selection. Clears heartbeat so
   *  the table shows as unoccupied, but preserves the session so the customer
   *  can return within the grace period without re-entering their PIN. */
  const goToTableSelection = useCallback(() => {
    const tableId = customerSession?.tableId;
    setIsViewingTableSelection(true);
    if (tableId) {
      void clearPresenceHeartbeat(tableId);
    }
    invalidateAllCaches();
  }, [customerSession?.tableId, invalidateAllCaches]);

  /** Signal that customer has selected a table. Re-enables SSE presence tracking. */
  const goToTable = useCallback(() => {
    setIsViewingTableSelection(false);
  }, []);

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
    isViewingTableSelection,
    goToTableSelection,
    goToTable,
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
