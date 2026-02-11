/**
 * ==========================================================================
 * Sushi Types — Core data models for the Sushi Dash application
 * ==========================================================================
 *
 * These TypeScript interfaces define the shape of all data flowing through
 * the application. They are used by the API layer, context, and components.
 *
 * Data flow:
 *   SushiItem → Menu display, order creation
 *   Table     → Table selection, order association
 *   Order     → Kitchen dashboard, queue tracking
 * ==========================================================================
 */

/** A single menu item (e.g., "#1 Salmon Nigiri") */
export interface SushiItem {
  /** Unique identifier */
  id: string;
  /** Display name with number prefix (e.g., "#1 Salmon Nigiri") */
  name: string;
  /** Emoji icon for visual representation */
  emoji: string;
  /** Category for grouping (e.g., "Nigiri", "Rolls", "Sashimi") */
  category: string;
  /** Whether this item shows a "HOT" badge (popular items) */
  isPopular?: boolean;
}

/** A restaurant table */
export interface Table {
  /** Unique identifier */
  id: string;
  /** Display label (e.g., "Table 1") */
  label: string;
}

/**
 * Order status — represents the lifecycle of an order:
 *   queued → preparing → ready → delivered
 *   Any active order can also be "cancelled" by a manager.
 */
export type OrderStatus = "queued" | "preparing" | "ready" | "delivered" | "cancelled";

/** A single item within an order, with its quantity */
export interface OrderItem {
  /** The sushi item that was ordered */
  sushi: SushiItem;
  /** How many of this item were ordered */
  quantity: number;
}

/**
 * A complete order — created when a customer confirms their cart.
 * Progresses through status stages managed by kitchen staff.
 */
export interface Order {
  /** Unique identifier */
  id: string;
  /** List of items in this order */
  items: OrderItem[];
  /** Current status in the kitchen workflow */
  status: OrderStatus;
  /** The table that placed this order */
  table: Table;
  /** When the order was placed */
  createdAt: Date;
  /** Position in the queue (computed, not stored) */
  queuePosition?: number;
}
