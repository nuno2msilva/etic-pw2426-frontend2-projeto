/**
 * auth.ts
 * ---------------------------------------------------------------------------
 * Authentication utilities for the Sushi Dash app.
 *
 * Security model:
 * - Passwords are hashed using **SHA-256** via the Web Crypto API before
 *   being stored in localStorage — plaintext passwords are never persisted.
 * - On first launch, `initializePasswords()` seeds hashed defaults for
 *   kitchen and manager roles.
 * - `verifyPassword()` hashes the user input and compares it to the stored
 *   hash, returning a boolean.
 *
 * Session management:
 * - `saveSession()` stores the authenticated role with a timestamp.
 * - `loadSession()` returns the role if the session is still valid
 *   (24-hour expiry by default), otherwise clears the session.
 * - Sessions are JSON objects in localStorage keyed by `AUTH_SESSION`.
 *
 * Exported functions:
 *   hashPassword, verifyPassword, initializePasswords,
 *   verifyKitchenPassword, verifyManagerPassword,
 *   updateKitchenPassword, updateManagerPassword,
 *   saveSession, loadSession, clearSession
 *
 * Used by: AuthContext, LoginModal, PasswordManager
 * ---------------------------------------------------------------------------
 */

// Creative default passwords for tables (easy to remember, not predictable)
export const DEFAULT_TABLE_PASSWORDS: Record<string, string> = {
  '1': 'table-aura',
  '2': 'table-zen',
  '3': 'table-vibe',
  '4': 'table-glow',
  '5': 'table-wave',
  '6': 'table-spark',
  '7': 'table-drift',
  '8': 'table-bloom',
  '9': 'table-echo',
  '10': 'table-nova',
};

export const DEFAULT_KITCHEN_PASSWORD = 'kitchen-master';
export const DEFAULT_MANAGER_PASSWORD = 'manager-admin';

// Storage keys
const STORAGE_KEYS = {
  TABLE_PASSWORDS: 'sushi-dash-table-passwords',
  KITCHEN_PASSWORD: 'sushi-dash-kitchen-password',
  MANAGER_PASSWORD: 'sushi-dash-manager-password',
  AUTH_SESSION: 'sushi-dash-auth-session',
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
 * Initialize default passwords if not set
 */
export async function initializePasswords(): Promise<void> {
  // Initialize table passwords
  const storedTablePasswords = localStorage.getItem(STORAGE_KEYS.TABLE_PASSWORDS);
  if (!storedTablePasswords) {
    const hashedPasswords: Record<string, string> = {};
    for (const [tableId, password] of Object.entries(DEFAULT_TABLE_PASSWORDS)) {
      hashedPasswords[tableId] = await hashPassword(password);
    }
    localStorage.setItem(STORAGE_KEYS.TABLE_PASSWORDS, JSON.stringify(hashedPasswords));
  }

  // Initialize kitchen password
  const storedKitchenPassword = localStorage.getItem(STORAGE_KEYS.KITCHEN_PASSWORD);
  if (!storedKitchenPassword) {
    const hash = await hashPassword(DEFAULT_KITCHEN_PASSWORD);
    localStorage.setItem(STORAGE_KEYS.KITCHEN_PASSWORD, hash);
  }

  // Initialize manager password
  const storedManagerPassword = localStorage.getItem(STORAGE_KEYS.MANAGER_PASSWORD);
  if (!storedManagerPassword) {
    const hash = await hashPassword(DEFAULT_MANAGER_PASSWORD);
    localStorage.setItem(STORAGE_KEYS.MANAGER_PASSWORD, hash);
  }
}

/**
 * Verify table password
 */
export async function verifyTablePassword(tableId: string, password: string): Promise<boolean> {
  const storedPasswords = localStorage.getItem(STORAGE_KEYS.TABLE_PASSWORDS);
  if (!storedPasswords) return false;
  
  const passwords = JSON.parse(storedPasswords) as Record<string, string>;
  const hash = passwords[tableId];
  if (!hash) return false;
  
  return verifyPassword(password, hash);
}

/**
 * Verify kitchen password
 */
export async function verifyKitchenPassword(password: string): Promise<boolean> {
  const hash = localStorage.getItem(STORAGE_KEYS.KITCHEN_PASSWORD);
  if (!hash) return false;
  return verifyPassword(password, hash);
}

/**
 * Verify manager password
 */
export async function verifyManagerPassword(password: string): Promise<boolean> {
  const hash = localStorage.getItem(STORAGE_KEYS.MANAGER_PASSWORD);
  if (!hash) return false;
  return verifyPassword(password, hash);
}

/**
 * Update a table password (manager only)
 */
export async function updateTablePassword(tableId: string, newPassword: string): Promise<void> {
  const storedPasswords = localStorage.getItem(STORAGE_KEYS.TABLE_PASSWORDS);
  const passwords = storedPasswords ? JSON.parse(storedPasswords) : {};
  passwords[tableId] = await hashPassword(newPassword);
  localStorage.setItem(STORAGE_KEYS.TABLE_PASSWORDS, JSON.stringify(passwords));
}

/**
 * Update kitchen password (manager only)
 */
export async function updateKitchenPassword(newPassword: string): Promise<void> {
  const hash = await hashPassword(newPassword);
  localStorage.setItem(STORAGE_KEYS.KITCHEN_PASSWORD, hash);
}

/**
 * Update manager password (manager only)
 */
export async function updateManagerPassword(newPassword: string): Promise<void> {
  const hash = await hashPassword(newPassword);
  localStorage.setItem(STORAGE_KEYS.MANAGER_PASSWORD, hash);
}

/**
 * Generate a creative password for a table
 */
export function generateTablePassword(tableId: string): string {
  const adjectives = ['aura', 'zen', 'vibe', 'glow', 'wave', 'spark', 'drift', 'bloom', 'echo', 'nova', 'pulse', 'mist', 'breeze', 'flame', 'frost'];
  const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
  return `table-${randomAdj}-${tableId}`;
}

// Auth session types
export type AuthRole = 'customer' | 'kitchen' | 'manager';

export interface AuthSession {
  role: AuthRole;
  tableId?: string; // Only for customer role
  authenticatedAt: number;
}

/**
 * Save auth session
 */
export function saveAuthSession(session: AuthSession): void {
  localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(session));
}

/**
 * Get current auth session
 */
export function getAuthSession(): AuthSession | null {
  const stored = localStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
  if (!stored) return null;
  
  try {
    const session = JSON.parse(stored) as AuthSession;
    // Session expires after 8 hours
    const EIGHT_HOURS = 8 * 60 * 60 * 1000;
    if (Date.now() - session.authenticatedAt > EIGHT_HOURS) {
      clearAuthSession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

/**
 * Clear auth session (logout)
 */
export function clearAuthSession(): void {
  localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
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
