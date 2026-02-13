/**
 * auth.ts
 * ---------------------------------------------------------------------------
 * Authentication utilities for the Sushi Dash app.
 *
 * Security model (localStorage-based, transitioning to backend):
 * - Kitchen/Manager passwords: SHA-256 hashed, stored in localStorage.
 * - Table PINs: 4-digit numeric PINs verified by the backend API.
 *   The frontend no longer stores table credentials — it calls
 *   POST /api/auth/login/table/:tableId with the PIN, and the server
 *   returns an httpOnly JWT cookie on success.
 *
 * Session management:
 * - `saveSession()` stores the authenticated role with a timestamp.
 * - `loadSession()` returns the role if the session is still valid
 *   (8-hour expiry), otherwise clears the session.
 *
 * Exported functions:
 *   hashPassword, verifyPassword, initializePasswords,
 *   verifyKitchenPassword, verifyManagerPassword,
 *   updateKitchenPassword, updateManagerPassword,
 *   loginTableWithPin,
 *   saveSession, loadSession, clearSession
 *
 * Used by: AuthContext, LoginModal, PasswordManager, PinPad
 * ---------------------------------------------------------------------------
 */

export const DEFAULT_KITCHEN_PASSWORD = 'kitchen-master';
export const DEFAULT_MANAGER_PASSWORD = 'manager-admin';

// Storage keys
const STORAGE_KEYS = {
  KITCHEN_PASSWORD: 'sushi-dash-kitchen-password',
  MANAGER_PASSWORD: 'sushi-dash-manager-password',
  AUTH_SESSION: 'sushi-dash-auth-session',
  CUSTOMER_SESSION: 'sushi-dash-customer-session',
  STAFF_SESSION: 'sushi-dash-staff-session',
} as const;

/**
 * Hash a password using SHA-256
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

/**
 * Initialize default passwords if not set (kitchen + manager only)
 */
export async function initializePasswords(): Promise<void> {
  const storedKitchenPassword = localStorage.getItem(STORAGE_KEYS.KITCHEN_PASSWORD);
  if (!storedKitchenPassword) {
    const hash = await hashPassword(DEFAULT_KITCHEN_PASSWORD);
    localStorage.setItem(STORAGE_KEYS.KITCHEN_PASSWORD, hash);
  }

  const storedManagerPassword = localStorage.getItem(STORAGE_KEYS.MANAGER_PASSWORD);
  if (!storedManagerPassword) {
    const hash = await hashPassword(DEFAULT_MANAGER_PASSWORD);
    localStorage.setItem(STORAGE_KEYS.MANAGER_PASSWORD, hash);
  }
}

const API = import.meta.env.VITE_API_URL ?? '';

/**
 * Login to a table via backend PIN verification.
 * Returns true on success (server sets httpOnly cookie).
 */
export async function loginTableWithPin(tableId: string, pin: string): Promise<boolean> {
  try {
    const res = await fetch(`${API}/api/auth/login/table/${tableId}`, {
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
 * Verify kitchen password — checks localStorage hash,
 * then authenticates with backend to set httpOnly JWT cookie.
 */
export async function verifyKitchenPassword(password: string): Promise<boolean> {
  const hash = localStorage.getItem(STORAGE_KEYS.KITCHEN_PASSWORD);
  if (!hash) return false;
  const localOk = await verifyPassword(password, hash);
  if (!localOk) return false;

  // Also login on the backend so the JWT cookie is set for API calls
  try {
    const res = await fetch(`${API}/api/auth/login/kitchen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ password }),
    });
    return res.ok;
  } catch {
    console.error('Backend kitchen login failed');
    return false;
  }
}

/**
 * Verify manager password — checks localStorage hash,
 * then authenticates with backend to set httpOnly JWT cookie.
 */
export async function verifyManagerPassword(password: string): Promise<boolean> {
  const hash = localStorage.getItem(STORAGE_KEYS.MANAGER_PASSWORD);
  if (!hash) return false;
  const localOk = await verifyPassword(password, hash);
  if (!localOk) return false;

  // Also login on the backend so the JWT cookie is set for API calls
  try {
    const res = await fetch(`${API}/api/auth/login/manager`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ password }),
    });
    return res.ok;
  } catch {
    console.error('Backend manager login failed');
    return false;
  }
}

/**
 * Update kitchen password (manager only) — updates both localStorage and backend
 */
export async function updateKitchenPassword(newPassword: string): Promise<void> {
  const hash = await hashPassword(newPassword);
  localStorage.setItem(STORAGE_KEYS.KITCHEN_PASSWORD, hash);
  // Sync with backend
  try {
    await fetch(`${API}/api/settings/passwords`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ role: 'kitchen', password: newPassword }),
    });
  } catch {
    console.error('Failed to sync kitchen password to backend');
  }
}

/**
 * Update manager password (manager only) — updates both localStorage and backend
 */
export async function updateManagerPassword(newPassword: string): Promise<void> {
  const hash = await hashPassword(newPassword);
  localStorage.setItem(STORAGE_KEYS.MANAGER_PASSWORD, hash);
  // Sync with backend
  try {
    await fetch(`${API}/api/settings/passwords`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ role: 'manager', password: newPassword }),
    });
  } catch {
    console.error('Failed to sync manager password to backend');
  }
}

// Auth session types
export type AuthRole = 'customer' | 'kitchen' | 'manager';

export interface AuthSession {
  role: AuthRole;
  tableId?: string; // Only for customer role
  authenticatedAt: number;
}

/**
 * Save auth session — stored per role category (customer vs staff)
 */
export function saveAuthSession(session: AuthSession): void {
  const key = session.role === 'customer' ? STORAGE_KEYS.CUSTOMER_SESSION : STORAGE_KEYS.STAFF_SESSION;
  localStorage.setItem(key, JSON.stringify(session));
  // Also write to legacy key for backwards compat
  localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(session));
}

/**
 * Get current auth session.
 * @param role - If specified, returns only the session for that category.
 *               If omitted, returns any valid session (staff preferred).
 */
export function getAuthSession(role?: 'customer' | 'staff'): AuthSession | null {
  const EIGHT_HOURS = 8 * 60 * 60 * 1000;

  function read(key: string): AuthSession | null {
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    try {
      const session = JSON.parse(stored) as AuthSession;
      if (Date.now() - session.authenticatedAt > EIGHT_HOURS) {
        localStorage.removeItem(key);
        return null;
      }
      return session;
    } catch {
      return null;
    }
  }

  if (role === 'customer') return read(STORAGE_KEYS.CUSTOMER_SESSION);
  if (role === 'staff') return read(STORAGE_KEYS.STAFF_SESSION);

  // No role specified — try staff first (higher privilege), then customer, then legacy
  return read(STORAGE_KEYS.STAFF_SESSION)
      ?? read(STORAGE_KEYS.CUSTOMER_SESSION)
      ?? read(STORAGE_KEYS.AUTH_SESSION);
}

/**
 * Clear auth session.
 * @param role - If specified, only clears that category. Otherwise clears all.
 */
export function clearAuthSession(role?: 'customer' | 'staff'): void {
  if (!role || role === 'customer') {
    localStorage.removeItem(STORAGE_KEYS.CUSTOMER_SESSION);
  }
  if (!role || role === 'staff') {
    localStorage.removeItem(STORAGE_KEYS.STAFF_SESSION);
  }
  // Always clean legacy key when clearing all
  if (!role) {
    localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
  }
}

/**
 * Check if user has access to a specific area
 */
export function hasAccess(session: AuthSession | null, requiredRole: AuthRole, tableId?: string): boolean {
  if (!session) return false;
  
  // Manager has access to everything
  if (session.role === 'manager') return true;
  
  // Kitchen has access to kitchen and any table
  if (session.role === 'kitchen') {
    return requiredRole === 'kitchen' || requiredRole === 'customer';
  }
  
  // Customer only has access to their own table
  if (session.role === 'customer') {
    if (requiredRole !== 'customer') return false;
    if (tableId !== undefined && session.tableId !== tableId) return false;
    return true;
  }
  
  return false;
}
