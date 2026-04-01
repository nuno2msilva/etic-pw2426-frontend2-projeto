/**
 * Umami Analytics Integration
 * Tracks user behavior: orders, sessions, admin actions, kitchen events
 * Only enabled in production (Vercel/hosted environments)
 *
 * Page views are handled automatically by Umami's built-in SPA hook
 * (patches history.pushState — works with Next.js App Router out of the box).
 * This file only handles custom events.
 */

// Replaced at build time by Next.js. 'production' on Vercel, 'development' locally.
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

export interface EventProperties {
  [key: string]: string | number | boolean;
}

interface UmamiTracker {
  track: (
    eventOrPayload: string | { url?: string; referrer?: string },
    properties?: EventProperties
  ) => void;
}

function getUmami(): UmamiTracker | undefined {
  if (typeof window === 'undefined') return undefined;
  return (window as unknown as { umami?: UmamiTracker }).umami;
}

/**
 * Track a custom event with Umami.
 * If Umami hasn't finished executing yet (first ~500ms), retries once after 2s.
 * All custom events fire after user interaction (PIN entry, button clicks) so
 * the retry window is never needed in practice — it's just a safety net.
 */
export function trackEvent(event: string, properties?: EventProperties): void {
  if (!IS_PRODUCTION) return;
  if (typeof window === 'undefined') return;

  const umami = getUmami();
  if (umami?.track) {
    umami.track(event, properties);
  } else {
    // Umami script hasn't executed yet — retry once after it loads
    setTimeout(() => {
      getUmami()?.track(event, properties);
    }, 2000);
  }
}

/**
 * Customer ordering events
 */
export const customerEvents = {
  tableSelected: (tableId: string) =>
    trackEvent('table_selected', { table_id: tableId }),

  pinEntered: (tableId: string, success: boolean) =>
    trackEvent('pin_entered', { table_id: tableId, success }),

  sessionStarted: (tableId: string) =>
    trackEvent('customer_session_started', { table_id: tableId }),

  sessionEnded: (tableId: string, durationSeconds: number) =>
    trackEvent('customer_session_ended', {
      table_id: tableId,
      duration_seconds: durationSeconds,
    }),

  cartUpdated: (tableId: string, itemCount: number, totalPrice: number) =>
    trackEvent('cart_updated', {
      table_id: tableId,
      item_count: itemCount,
      total_price: totalPrice,
    }),

  orderPlaced: (
    tableId: string,
    itemCount: number,
    totalPrice: number,
    duration: number
  ) =>
    trackEvent('order_placed', {
      table_id: tableId,
      item_count: itemCount,
      total_price: totalPrice,
      session_duration_seconds: duration,
    }),

  orderCancelled: (tableId: string) =>
    trackEvent('order_cancelled', { table_id: tableId }),

  menuItemViewed: (itemName: string, category: string) =>
    trackEvent('menu_item_viewed', { item_name: itemName, category }),

  menuBrowsed: (category: string, duration: number) =>
    trackEvent('menu_browsed', { category, duration_seconds: duration }),
};

/**
 * Staff authentication events
 */
export const staffEvents = {
  loginAttempted: (role: string, success: boolean) =>
    trackEvent('staff_login_attempted', { role, success }),

  loginSucceeded: (role: string) =>
    trackEvent('staff_login_succeeded', { role }),

  passwordChanged: (role: string) =>
    trackEvent('staff_password_changed', { role }),

  loggedOut: (role: string, sessionDuration: number) =>
    trackEvent('staff_logged_out', { role, session_duration_seconds: sessionDuration }),

  unauthorized: (role: string, attemptedRoute: string) =>
    trackEvent('staff_unauthorized_access', { role, route: attemptedRoute }),
};

/**
 * Kitchen events
 */
export const kitchenEvents = {
  orderReceived: (orderId: string, itemCount: number) =>
    trackEvent('kitchen_order_received', {
      order_id: orderId,
      item_count: itemCount,
    }),

  orderStatusChanged: (orderId: string, status: string) =>
    trackEvent('kitchen_order_status_changed', {
      order_id: orderId,
      status,
    }),

  orderCancelled: (orderId: string, reason?: string) =>
    trackEvent('kitchen_order_cancelled', {
      order_id: orderId,
      reason: reason || 'unknown',
    }),

  averagePreparationTime: (status: string, seconds: number) =>
    trackEvent('kitchen_average_prep_time', {
      status,
      duration_seconds: seconds,
    }),
};

/**
 * Admin/Manager events
 */
export const adminEvents = {
  menuItemAdded: (itemName: string, category: string, price: number) =>
    trackEvent('admin_menu_item_added', {
      item_name: itemName,
      category,
      price,
    }),

  menuItemEdited: (itemName: string, price: number) =>
    trackEvent('admin_menu_item_edited', { item_name: itemName, price }),

  menuItemDeleted: (itemName: string) =>
    trackEvent('admin_menu_item_deleted', { item_name: itemName }),

  tableAdded: (tableNumber: number) =>
    trackEvent('admin_table_added', { table_number: tableNumber }),

  tableDeleted: (tableNumber: number) =>
    trackEvent('admin_table_deleted', { table_number: tableNumber }),

  pinChanged: (tableNumber: number) =>
    trackEvent('admin_pin_changed', { table_number: tableNumber }),

  orderLimitChanged: (newLimit: number) =>
    trackEvent('admin_order_limit_changed', { new_limit: newLimit }),

  settingsUpdated: (settingName: string) =>
    trackEvent('admin_settings_updated', { setting_name: settingName }),

  reportViewed: (reportType: string) =>
    trackEvent('admin_report_viewed', { report_type: reportType }),
};

/**
 * System/Performance events
 */
export const systemEvents = {
  errorOccurred: (errorType: string, message: string) =>
    trackEvent('error_occurred', {
      error_type: errorType,
      message: message.substring(0, 100), // Limit message length
    }),

  apiLatency: (endpoint: string, ms: number) =>
    trackEvent('api_latency', { endpoint, duration_ms: ms }),

  sseConnectionLost: (reconnectAttempt: number) =>
    trackEvent('sse_connection_lost', { reconnect_attempt: reconnectAttempt }),

  idleTimeoutTriggered: (sessionDuration: number) =>
    trackEvent('idle_timeout_triggered', { session_duration_seconds: sessionDuration }),

  graceperiodUsed: () => trackEvent('grace_period_used'),
};

export default { trackEvent, customerEvents, staffEvents, kitchenEvents, adminEvents, systemEvents };
