/**
 * timeouts.ts — Centralized timeout and interval configuration
 *
 * All time-related constants used throughout the app for easy customization.
 * All values are in milliseconds (ms).
 *
 * VERCEL OPTIMIZATION:
 *   - Aggressive presence polling (3s) ensures UI stays fresh despite network latency
 *   - Shorter keep-alive (15s) prevents Vercel proxy timeouts
 *   - Exponential backoff with cap prevents reconnect storms
 */

// ── Customer Session Grace Period ────────────────────────────────────
/** Time window to restore customer session after accidental tab/browser close without re-entering PIN */
export const CUSTOMER_SESSION_GRACE_PERIOD_MS = 5 * 60 * 1000; // 5 minutes

/** Interval for customer presence heartbeat (localStorage timestamp for grace period detection) */
export const CUSTOMER_PRESENCE_HEARTBEAT_INTERVAL_MS = 30 * 1000; // 30 seconds

// ── SSE (Server-Sent Events) Timeouts ────────────────────────────────
/** Server-side idle timeout: disconnect customer if no new orders placed for this duration */
export const SSE_IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

/** Server-side keep-alive ping interval to prevent proxy/firewall timeout (reduced for Vercel) */
export const SSE_KEEP_ALIVE_INTERVAL_MS = 15 * 1000; // 15 seconds (was 30s, reduced for Vercel)

/** Client-side initial reconnection delay after SSE connection closes */
export const SSE_RECONNECT_DELAY_MS = 1 * 1000; // 1 second (initial backoff)

/** Maximum reconnection delay (exponential backoff cap to prevent storm) */
export const SSE_MAX_RECONNECT_DELAY_MS = 30 * 1000; // 30 seconds max

// ── Presence Polling ─────────────────────────────────────────────────
/** Aggressive polling interval for table presence (fallback if SSE drops) — Vercel optimization */
export const PRESENCE_POLLING_INTERVAL_MS = 3 * 1000; // 3 seconds (lighter mobile runtime, still responsive)

// ── Session Validation Polling ───────────────────────────────────────
/** Interval for staff session server-side validation (detects admin logout actions) */
export const STAFF_SESSION_VALIDATION_INTERVAL_MS = 10 * 1000; // 10 seconds

/** Interval for customer session server-side validation (detects PIN randomization ejection) */
export const CUSTOMER_SESSION_VALIDATION_INTERVAL_MS = 5 * 1000; // 5 seconds

/** Interval for customer presence polling (tracks last activity) */
export const CUSTOMER_PRESENCE_POLLING_INTERVAL_MS = 60 * 1000; // 60 seconds
