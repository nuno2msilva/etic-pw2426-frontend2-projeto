/** 
 * Auth utilities — Email+password login (backend JWT via httpOnly cookies)
 * No client-side password storage (security improvement)
 */

import { API_BASE } from "@/features/shared/lib/config";

// Storage keys (customer PIN only - no staff passwords stored client-side)
const STORAGE_KEYS = {
  AUTH_SESSION: 'sushi-dash-auth-session',
  CUSTOMER_SESSION: 'sushi-dash-customer-session',
  STAFF_SESSION: 'sushi-dash-staff-session',
  LEGACY_KITCHEN_PASSWORD: 'sushi-dash-kitchen-password',
  LEGACY_MANAGER_PASSWORD: 'sushi-dash-manager-password',
} as const;

// Legacy defaults kept for test/backward compatibility only.
export const DEFAULT_KITCHEN_PASSWORD = 'kitchen123';
export const DEFAULT_MANAGER_PASSWORD = 'manager123';

function readSessionStorage(key: string): string | null {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage.getItem(key);
}

function writeSessionStorage(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(key, value);
}

function removeSessionStorage(key: string): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(key);
}

function readLocalStorage(key: string): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(key);
}

function writeLocalStorage(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, value);
}

function removeLocalStorage(key: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(key);
}

async function sha256(input: string): Promise<string> {
  if (globalThis.crypto?.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  const { createHash } = await import('crypto');
  return createHash('sha256').update(input).digest('hex');
}

/** @deprecated Legacy helper kept for compatibility with existing tests. */
export async function hashPassword(password: string): Promise<string> {
  return sha256(password);
}

/** @deprecated Legacy helper kept for compatibility with existing tests. */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const computed = await hashPassword(password);
  return computed === hash;
}

/** @deprecated Legacy helper kept for compatibility with existing tests. */
export async function initializePasswords(): Promise<void> {
  if (typeof localStorage === 'undefined') return;

  if (!localStorage.getItem(STORAGE_KEYS.LEGACY_KITCHEN_PASSWORD)) {
    const hash = await hashPassword(DEFAULT_KITCHEN_PASSWORD);
    localStorage.setItem(STORAGE_KEYS.LEGACY_KITCHEN_PASSWORD, hash);
  }

  if (!localStorage.getItem(STORAGE_KEYS.LEGACY_MANAGER_PASSWORD)) {
    const hash = await hashPassword(DEFAULT_MANAGER_PASSWORD);
    localStorage.setItem(STORAGE_KEYS.LEGACY_MANAGER_PASSWORD, hash);
  }
}

/** @deprecated Legacy helper kept for compatibility with existing tests. */
export async function verifyKitchenPassword(password: string): Promise<boolean> {
  await initializePasswords();
  const stored = localStorage.getItem(STORAGE_KEYS.LEGACY_KITCHEN_PASSWORD);
  if (!stored) return false;
  const localMatch = await verifyPassword(password, stored);
  if (!localMatch) return false;

  try {
    const res = await fetch(`${API_BASE}/api/auth/login/kitchen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ password }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** @deprecated Legacy helper kept for compatibility with existing tests. */
export async function verifyManagerPassword(password: string): Promise<boolean> {
  await initializePasswords();
  const stored = localStorage.getItem(STORAGE_KEYS.LEGACY_MANAGER_PASSWORD);
  if (!stored) return false;
  const localMatch = await verifyPassword(password, stored);
  if (!localMatch) return false;

  try {
    const res = await fetch(`${API_BASE}/api/auth/login/manager`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ password }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** @deprecated Legacy helper kept for compatibility with existing tests. */
export async function updateKitchenPassword(password: string): Promise<void> {
  const hash = await hashPassword(password);
  localStorage.setItem(STORAGE_KEYS.LEGACY_KITCHEN_PASSWORD, hash);

  await fetch(`${API_BASE}/api/settings/passwords`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ role: 'kitchen', password }),
  });
}

/** @deprecated Legacy helper kept for compatibility with existing tests. */
export async function updateManagerPassword(password: string): Promise<void> {
  const hash = await hashPassword(password);
  localStorage.setItem(STORAGE_KEYS.LEGACY_MANAGER_PASSWORD, hash);

  await fetch(`${API_BASE}/api/settings/passwords`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ role: 'manager', password }),
  });
}

/** Login to a table via backend PIN verification (sets httpOnly JWT cookie) */
export async function loginTableWithPin(tableId: string, pin: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/login/table/${tableId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ pin }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** 
 * Login as staff with username/email + password
 * Backend validates and sets httpOnly JWT cookie (no client-side password storage)
 * Supports roles: kitchen, manager, admin
 */
export async function loginAsStaff(
  identifier: string,
  password: string,
): Promise<{
  success: boolean;
  role?: AuthRole;
  userId?: number;
  email?: string;
  username?: string | null;
  permission?: Permission;
  passwordResetRequired?: boolean;
  skipPasswordResetReminder?: boolean;
  error?: string;
}> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/login/staff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ identifier, password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: 'Login failed' }));
      return { success: false, error: data.error ?? 'Login failed' };
    }

    const data = await res.json();
    return {
      success: true,
      role: data.role,
      userId: data.userId,
      email: data.email,
      username: data.username ?? null,
      permission: data.role,
      passwordResetRequired: data.passwordResetRequired ?? false,
      skipPasswordResetReminder: data.skipPasswordResetReminder ?? false,
    };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

/** Change own password (auth required) */
export async function changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: 'Failed to change password' }));
      return { success: false, error: data.error };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: 'Network error' };
  }
}

/** Skip password reset reminder until admin resets password again */
export async function skipPasswordResetReminder(): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/skip-password-reset-reminder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: 'Failed to update reminder preference' }));
      return { success: false, error: data.error };
    }

    return { success: true };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

// Auth session types (no staff password stored)
export type AuthRole = 'customer' | 'kitchen' | 'manager' | 'admin';
export type Permission = 'kitchen' | 'manager' | 'admin';

export interface AuthSession {
  role: AuthRole;
  tableId?: string;      // Only for customer role
  userId?: number;       // Only for staff roles
  email?: string;        // Only for staff roles
  username?: string | null;  // Only for staff roles
  permission?: Permission; // Only for staff roles (kitchen/manager/admin)
  authenticatedAt: number;
  passwordResetRequired?: boolean; // Flag set by admin password reset
  skipPasswordResetReminder?: boolean; // User opted out of reset reminder
}

function permissionCanAccess(requiredPermission: Permission, currentPermission: Permission): boolean {
  if (currentPermission === 'admin') {
    return requiredPermission === 'admin';
  }

  if (currentPermission === 'manager') {
    return requiredPermission === 'manager' || requiredPermission === 'kitchen';
  }

  return requiredPermission === 'kitchen';
}

export function normalizeAuthRole(value?: string): AuthRole | undefined {
  if (!value) return undefined;
  const normalized = value.toLowerCase();
  if (normalized === 'customer' || normalized === 'kitchen' || normalized === 'manager' || normalized === 'admin') {
    return normalized;
  }
  return undefined;
}

export function normalizePermission(value?: string): Permission | undefined {
  if (!value) return undefined;
  const normalized = value.toLowerCase();
  if (normalized === 'kitchen' || normalized === 'manager' || normalized === 'admin') {
    return normalized;
  }
  return undefined;
}

export function resolveStaffPermission(
  session?: Pick<AuthSession, 'role' | 'permission'> | null,
): Permission | undefined {
  if (!session) return undefined;
  const normalizedRole = normalizeAuthRole(session.role);
  if (!normalizedRole || normalizedRole === 'customer') return undefined;

  // The role comes from the authenticated token and is the canonical source.
  // Prefer it over stored permission metadata, which may be stale in local storage.
  const permissionFromRole = normalizePermission(normalizedRole);
  if (permissionFromRole) return permissionFromRole;

  return normalizePermission(session.permission);
}

export function hasStaffPermission(
  session: Pick<AuthSession, 'role' | 'permission'> | null | undefined,
  requiredPermission: Permission,
): boolean {
  const currentPermission = resolveStaffPermission(session);
  if (!currentPermission) return false;
  return permissionCanAccess(requiredPermission, currentPermission);
}

// Save auth session — stored per role category (customer vs staff)
export function saveAuthSession(session: AuthSession): void {
  const key = session.role === 'customer' ? STORAGE_KEYS.CUSTOMER_SESSION : STORAGE_KEYS.STAFF_SESSION;
  const serialized = JSON.stringify(session);
  // Session-scoped persistence: survives route changes/reloads in same tab.
  writeSessionStorage(key, serialized);
  writeSessionStorage(STORAGE_KEYS.AUTH_SESSION, serialized);
}

// Get current auth session (from localStorage, mirrors httpOnly JWT state)
export function getAuthSession(role?: 'customer' | 'staff'): AuthSession | null {
  const EIGHT_HOURS = 8 * 60 * 60 * 1000;

  function read(key: string): AuthSession | null {
    const fromSession = readSessionStorage(key);
    const fromLocal = readLocalStorage(key);
    const stored = fromSession ?? fromLocal;
    if (!stored) return null;
    try {
      const session = JSON.parse(stored) as AuthSession;
      // Check if session expired
      if (Date.now() - session.authenticatedAt > EIGHT_HOURS) {
        removeSessionStorage(key);
        removeLocalStorage(key);
        return null;
      }
      // Migrate legacy localStorage session to sessionStorage on first read.
      if (!fromSession && fromLocal) {
        writeSessionStorage(key, fromLocal);
        removeLocalStorage(key);
      }
      return session;
    } catch {
      return null;
    }
  }

  if (role === 'customer') return read(STORAGE_KEYS.CUSTOMER_SESSION);
  if (role === 'staff') return read(STORAGE_KEYS.STAFF_SESSION);

  // No role specified — try staff first (higher privilege), then customer
  return read(STORAGE_KEYS.STAFF_SESSION)
      ?? read(STORAGE_KEYS.CUSTOMER_SESSION)
      ?? read(STORAGE_KEYS.AUTH_SESSION);
}

// Clear auth session
export function clearAuthSession(role?: 'customer' | 'staff'): void {
  if (!role || role === 'customer') {
    removeSessionStorage(STORAGE_KEYS.CUSTOMER_SESSION);
    removeLocalStorage(STORAGE_KEYS.CUSTOMER_SESSION);
  }
  if (!role || role === 'staff') {
    removeSessionStorage(STORAGE_KEYS.STAFF_SESSION);
    removeLocalStorage(STORAGE_KEYS.STAFF_SESSION);
  }
  // Always clean legacy key when clearing all
  if (!role) {
    removeSessionStorage(STORAGE_KEYS.AUTH_SESSION);
    removeLocalStorage(STORAGE_KEYS.AUTH_SESSION);
  }
}

// Check if user has access to a specific area (hierarchical permissions)
export function hasAccess(
  session: AuthSession | null,
  requiredRole: AuthRole | Permission,
  tableId?: string
): boolean {
  if (!session) return false;

  if (requiredRole === 'customer') {
    if (session.role !== 'customer') return true;
    if (tableId !== undefined && session.tableId !== tableId) return false;
    return true;
  }

  const staffPermission = resolveStaffPermission(session);
  if (staffPermission) {
    const requiredPermission = normalizePermission(requiredRole);
    if (!requiredPermission) return false;
    return permissionCanAccess(requiredPermission, staffPermission);
  }

  // For customer sessions
  if (session.role === 'customer') {
    return false;
  }

  return false;
}
