/**
 * timeouts.ts — Centralized timeout and interval configuration
 *
 * All time-related constants used throughout the app for easy customization.
 * All values are in milliseconds (ms).
 */

// ── Customer Session Grace Period ────────────────────────────────────
/** Time window to restore customer session after accidental tab/browser close without re-entering PIN */
export const CUSTOMER_SESSION_GRACE_PERIOD_MS = 5 * 60 * 1000; // 5 minutes

/** Interval for customer presence heartbeat (localStorage timestamp for grace period detection) */
export const CUSTOMER_PRESENCE_HEARTBEAT_INTERVAL_MS = 30 * 1000; // 30 seconds

// ── SSE (Server-Sent Events) Timeouts ────────────────────────────────
/** Server-side idle timeout: disconnect customer if no new orders placed for this duration */
export const SSE_IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

/** Server-side keep-alive ping interval to prevent proxy/firewall timeout */
export const SSE_KEEP_ALIVE_INTERVAL_MS = 30 * 1000; // 30 seconds

/** Client-side reconnection delay after SSE connection closes */
export const SSE_RECONNECT_DELAY_MS = 2 * 1000; // 2 seconds

// ── Session Validation Polling ───────────────────────────────────────
/** Interval for staff session server-side validation (detects admin logout actions) */
export const STAFF_SESSION_VALIDATION_INTERVAL_MS = 5 * 1000; // 5 seconds

/** Interval for customer session server-side validation (detects PIN randomization ejection) */
export const CUSTOMER_SESSION_VALIDATION_INTERVAL_MS = 2 * 1000; // 2 seconds

/** Interval for customer presence polling (tracks last activity) */
export const CUSTOMER_PRESENCE_POLLING_INTERVAL_MS = 60 * 1000; // 60 seconds
