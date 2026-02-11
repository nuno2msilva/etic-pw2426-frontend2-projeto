/**
 * ==========================================================================
 * OrderCard — Displays a single order with status and action button
 * ==========================================================================
 *
 * Used in the Kitchen Dashboard to show each order's details:
 *   - Table name, current status badge
 *   - List of ordered items with quantities
 *   - Action button to advance the order status
 *
 * Status flow: Queued → Preparing → Ready → Delivered
 * Each status has its own visual style (colour-coded badges).
 *
 * Props:
 *   order          — The Order object to display
 *   onUpdateStatus — Callback to advance status (kitchen only)
 *   showActions    — Whether to show the action button
 *
 * ==========================================================================
 */

import type { Order, OrderStatus } from "@/types/sushi";

interface OrderCardProps {
  order: Order;
  onUpdateStatus?: (status: OrderStatus) => void;
  onCancel?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

const STATUS_STYLES: Record<OrderStatus, string> = {
  queued: "bg-accent/20 text-accent-foreground",
  preparing: "bg-primary/10 text-primary",
  ready: "bg-sushi-green/20 text-sushi-green",
  delivered: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  queued: "⏳ Queued",
  preparing: "🔥 Preparing",
  ready: "✅ Ready",
  delivered: "🎉 Delivered",
  cancelled: "❌ Cancelled",
};

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  queued: "preparing",
  preparing: "ready",
  ready: "delivered",
};

const ACTION_LABELS: Partial<Record<OrderStatus, string>> = {
  queued: "Start Preparing",
  preparing: "Mark Ready",
  ready: "Deliver",
};

const OrderCard = ({ 
  order, 
  onUpdateStatus, 
  onCancel, 
  onDelete, 
  showActions = false 
}: OrderCardProps) => {
  const nextStatus = NEXT_STATUS[order.status];
  const canCancel = onCancel && (order.status === "queued" || order.status === "preparing");
  const canDelete = onDelete && (order.status === "delivered" || order.status === "cancelled");

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-bold text-card-foreground">{order.table.label}</h3>
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_STYLES[order.status]}`}>
          {STATUS_LABELS[order.status]}
        </span>
      </div>
      <ul className="space-y-1 mb-3">
        {order.items.map((item, i) => (
          <li key={i} className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {item.sushi.emoji} {item.sushi.name}
            </span>
            <span className="font-medium text-foreground">{item.quantity}x</span>
          </li>
        ))}
      </ul>
      {showActions && (
        <div className="border-t pt-3 space-y-2">
          {nextStatus && onUpdateStatus && (
            <button
              onClick={() => onUpdateStatus(nextStatus)}
              className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-opacity"
            >
              {ACTION_LABELS[order.status]}
            </button>
          )}
          {canCancel && (
            <button
              onClick={onCancel}
              className="w-full px-4 py-2 rounded-lg bg-destructive/10 text-destructive text-sm font-bold hover:bg-destructive/20 transition-colors"
            >
              Cancel Order
            </button>
          )}
          {canDelete && (
            <button
              onClick={onDelete}
              className="w-full px-4 py-2 rounded-lg bg-muted text-muted-foreground text-sm font-bold hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              Delete Order
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderCard;
