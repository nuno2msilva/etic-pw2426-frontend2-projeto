// Shared feature barrel export - context, hooks, utilities, types
export { AuthProvider, useAuth } from './context/AuthContext';
export { default as QueryRuntimeProvider } from './context/QueryRuntimeProvider';

export { useServerEvents } from './hooks/useServerEvents';
export { useTablePresence } from './hooks/useTablePresence';
export { useMenuQuery, useAddMenuItem, useRemoveMenuItem, useUpdateMenuItem, useToggleItemAvailability, useCategoriesQuery, useAddCategory, useDeleteCategory, useTablesQuery, useAddTable, useUpdateTable, useRemoveTable, useOrdersQuery, usePlaceOrder, useUpdateOrder, useCancelOrder, useDeleteOrder, useSettingsQuery, useUpdateSettings, queryKeys } from './hooks/useApiQueries';

export { default as AppHeader } from './components/AppHeader';
export { SEOHead } from './components/SEOHead';
export { default as CRTScreen } from './components/CRTScreen';
export { default as LiveUpdatesClient } from './components/LiveUpdatesClient';
export { default as WebVitalsReporter } from './components/WebVitalsReporter';
export { default as WithAppProvider } from './components/WithAppProvider';
export { default as NotFound } from './components/NotFound';

export * from './lib/config';
export { notifySuccess, notifyError } from './lib/notify';
export { UI_TEXT } from './lib/ui-text';
export * from './lib/api';
export { hashPassword, DEFAULT_KITCHEN_PASSWORD, DEFAULT_MANAGER_PASSWORD, hasStaffPermission } from './lib/auth';
export { STATUS_BADGE_VARIANT, STATUS_LABELS } from './lib/order-status';
export { cn } from './lib/utils';
export {
  CUSTOMER_SESSION_GRACE_PERIOD_MS,
  CUSTOMER_PRESENCE_HEARTBEAT_INTERVAL_MS,
  STAFF_SESSION_VALIDATION_INTERVAL_MS,
  CUSTOMER_SESSION_VALIDATION_INTERVAL_MS,
} from './lib/timeouts';

export type * from './types/models';
