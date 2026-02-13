/**
 * ==========================================================================
 * AuthContext — Authentication state management (dual-session)
 * ==========================================================================
 *
 * Manages TWO independent auth sessions simultaneously:
 *   - Customer session: stored in `sushi_customer` cookie + localStorage
 *   - Staff session: stored in `sushi_staff` cookie + localStorage
 *
 * This allows a user to be logged in as both a customer (at a table) and
 * a manager/kitchen at the same time — even in the same browser.
 * Logging in as one role never overwrites the other.
 *
 * Roles:
 *   - Customer: access to their assigned table only
 *   - Kitchen: access to the kitchen order dashboard
 *   - Manager: access to everything (settings, passwords, menu, tables)
 *
 * ==========================================================================
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { API_BASE } from '@/lib/config';
import {AuthSession, AuthRole, getAuthSession, saveAuthSession, clearAuthSession, initializePasswords, loginTableWithPin, verifyKitchenPassword,  verifyManagerPassword, hasAccess,} from '@/lib/auth';

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
  /** Login as kitchen staff */
  loginAsKitchen: (password: string) => Promise<boolean>;
  /** Login as manager */
  loginAsManager: (password: string) => Promise<boolean>;
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [customerSession, setCustomerSession] = useState<AuthSession | null>(null);
  const [staffSession, setStaffSession] = useState<AuthSession | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const queryClient = useQueryClient();

  const invalidateAllCaches = useCallback(() => {
    queryClient.invalidateQueries();
  }, [queryClient]);

  // Initialize auth system on mount — restore both sessions
  useEffect(() => {
    const init = async () => {
      await initializePasswords();
      const existingCustomer = getAuthSession('customer');
      const existingStaff = getAuthSession('staff');
      if (existingCustomer) setCustomerSession(existingCustomer);
      if (existingStaff) setStaffSession(existingStaff);
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

  const loginAsKitchen = useCallback(async (password: string): Promise<boolean> => {
    const isValid = await verifyKitchenPassword(password);
    if (isValid) {
      const newSession: AuthSession = {
        role: 'kitchen',
        authenticatedAt: Date.now(),
      };
      saveAuthSession(newSession);
      setStaffSession(newSession);
      invalidateAllCaches();
      return true;
    }
    return false;
  }, [invalidateAllCaches]);

  const loginAsManager = useCallback(async (password: string): Promise<boolean> => {
    const isValid = await verifyManagerPassword(password);
    if (isValid) {
      const newSession: AuthSession = {
        role: 'manager',
        authenticatedAt: Date.now(),
      };
      saveAuthSession(newSession);
      setStaffSession(newSession);
      invalidateAllCaches();
      return true;
    }
    return false;
  }, [invalidateAllCaches]);

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
    loginAsKitchen,
    loginAsManager,
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
