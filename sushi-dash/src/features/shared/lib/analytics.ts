/**
 * Umami Analytics Integration
 * Tracks user behavior: orders, sessions, admin actions, kitchen events
 * Only enabled in production (Vercel/hosted environments)
 */

const UMAMI_TRACKING_ID = process.env.NEXT_PUBLIC_UMAMI_ID || '';
const UMAMI_ENDPOINT = process.env.NEXT_PUBLIC_UMAMI_ENDPOINT || 'https://analytics.umami.is';

// Only enable analytics in production (Vercel) to avoid local dev noise
const IS_PRODUCTION = process.env.NODE_ENV === 'production' && typeof window !== 'undefined';

interface EventProperties {
  [key: string]: string | number | boolean;
}

interface UmamiTracker {
  track: (
    eventOrPayload: string | { url?: string; referrer?: string; title?: string },
    properties?: EventProperties
  ) => void;
}

type QueuedItem =
  | { kind: 'event'; name: string; properties?: EventProperties }
  | { kind: 'pageview'; url: string; referrer: string };

// Queue for events fired before the Umami script has finished loading.
// Flushed in UmamiIntegration onLoad callback.
const pendingQueue: QueuedItem[] = [];

/**
 * Flush all queued events/pageviews once window.umami is ready.
 * Called from UmamiIntegration's onLoad prop.
 */
export function flushAnalyticsQueue(): void {
  if (typeof window === 'undefined') return;
  const umami = (window as unknown as { umami?: UmamiTracker }).umami;
  if (!umami?.track) return;
  let item: QueuedItem | undefined;
  while ((item = pendingQueue.shift()) !== undefined) {
    if (item.kind === 'event') {
      umami.track(item.name, item.properties);
    } else {
      umami.track({ url: item.url, referrer: item.referrer });
    }
  }
}

/**
 * Track a custom event with Umami.
 * If Umami hasn't loaded yet, the event is queued and flushed on onLoad.
 */
export function trackEvent(event: string, properties?: EventProperties): void {
  if (!IS_PRODUCTION || !UMAMI_TRACKING_ID || typeof window === 'undefined') return;

  const umami = (window as unknown as { umami?: UmamiTracker }).umami;
  if (!umami?.track) {
    // Umami script hasn't loaded yet — queue for flush on onLoad
    pendingQueue.push({ kind: 'event', name: event, properties });
    return;
  }

  umami.track(event, properties);
}

/**
 * Track a pageview — uses Umami v2's object form of track().
 * If Umami hasn't loaded yet, the pageview is queued.
 */
export function trackPageView(url: string, referrer?: string): void {
  if (!IS_PRODUCTION || !UMAMI_TRACKING_ID || typeof window === 'undefined') return;

  const umami = (window as unknown as { umami?: UmamiTracker }).umami;
  if (!umami?.track) {
    pendingQueue.push({ kind: 'pageview', url, referrer: referrer ?? document.referrer });
    return;
  }

  umami.track({ url, referrer: referrer ?? document.referrer });
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

export default { trackEvent, trackPageView, customerEvents, staffEvents, kitchenEvents, adminEvents, systemEvents };
