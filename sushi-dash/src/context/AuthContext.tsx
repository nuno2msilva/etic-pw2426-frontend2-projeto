/**
 * ==========================================================================
 * AuthContext — Authentication state management
 * ==========================================================================
 *
 * Manages user authentication sessions via React Context API.
 * Supports three roles:
 *   - Customer: access to their assigned table only
 *   - Kitchen: access to the kitchen order dashboard
 *   - Manager: access to everything (settings, passwords, menu, tables)
 *
 * Features:
 *   - SHA-256 password hashing via Web Crypto API
 *   - Sessions persist in localStorage (8-hour expiry)
 *   - Role-based access control via hasAccess()
 *   - All handlers memoised with useCallback
 *
 * Usage:
 *   const { loginAsKitchen, checkAccess, logout } = useAuth();
 *
 * ==========================================================================
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  AuthSession,
  AuthRole,
  getAuthSession,
  saveAuthSession,
  clearAuthSession,
  initializePasswords,
  verifyTablePassword,
  verifyKitchenPassword,
  verifyManagerPassword,
  hasAccess,
} from '@/lib/auth';

interface AuthContextType {
  /** Current authentication session */
  session: AuthSession | null;
  /** Whether auth system is initialized */
  isInitialized: boolean;
  /** Whether user is currently authenticated */
  isAuthenticated: boolean;
  /** Login as customer for a specific table */
  loginAsCustomer: (tableId: string, password: string) => Promise<boolean>;
  /** Login as kitchen staff */
  loginAsKitchen: (password: string) => Promise<boolean>;
  /** Login as manager */
  loginAsManager: (password: string) => Promise<boolean>;
  /** Logout current session */
  logout: () => void;
  /** Check if current session has access to a role/table */
  checkAccess: (requiredRole: AuthRole, tableId?: string) => boolean;
  /** Get the authenticated table ID (for customers) */
  authenticatedTableId: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize auth system on mount
  useEffect(() => {
    const init = async () => {
      await initializePasswords();
      const existingSession = getAuthSession();
      setSession(existingSession);
      setIsInitialized(true);
    };
    init();
  }, []);

  const loginAsCustomer = useCallback(async (tableId: string, password: string): Promise<boolean> => {
    const isValid = await verifyTablePassword(tableId, password);
    if (isValid) {
      const newSession: AuthSession = {
        role: 'customer',
        tableId,
        authenticatedAt: Date.now(),
      };
      saveAuthSession(newSession);
      setSession(newSession);
      return true;
    }
    return false;
  }, []);

  const loginAsKitchen = useCallback(async (password: string): Promise<boolean> => {
    const isValid = await verifyKitchenPassword(password);
    if (isValid) {
      const newSession: AuthSession = {
        role: 'kitchen',
        authenticatedAt: Date.now(),
      };
      saveAuthSession(newSession);
      setSession(newSession);
      return true;
    }
    return false;
  }, []);

  const loginAsManager = useCallback(async (password: string): Promise<boolean> => {
    const isValid = await verifyManagerPassword(password);
    if (isValid) {
      const newSession: AuthSession = {
        role: 'manager',
        authenticatedAt: Date.now(),
      };
      saveAuthSession(newSession);
      setSession(newSession);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    clearAuthSession();
    setSession(null);
  }, []);

  const checkAccess = useCallback((requiredRole: AuthRole, tableId?: string): boolean => {
    return hasAccess(session, requiredRole, tableId);
  }, [session]);

  const authenticatedTableId = session?.role === 'customer' ? session.tableId ?? null : null;

  const value: AuthContextType = {
    session,
    isInitialized,
    isAuthenticated: session !== null,
    loginAsCustomer,
    loginAsKitchen,
    loginAsManager,
    logout,
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
