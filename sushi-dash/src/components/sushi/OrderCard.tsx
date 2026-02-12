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
import CardPanel from "./CardPanel";
import Badge from "./Badge";
import ActionButton from "./ActionButton";

interface OrderCardProps {
  order: Order;
  onUpdateStatus?: (status: OrderStatus) => void;
  onCancel?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

const STATUS_BADGE_VARIANT: Record<OrderStatus, "accent" | "primary-soft" | "success" | "muted" | "destructive"> = {
  queued: "accent",
  preparing: "primary-soft",
  ready: "success",
  delivered: "muted",
  cancelled: "destructive",
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
    <CardPanel variant="section" className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-bold text-card-foreground">{order.table.label}</h3>
        <Badge variant={STATUS_BADGE_VARIANT[order.status]} size="md">
          {STATUS_LABELS[order.status]}
        </Badge>
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
            <ActionButton
              variant="primary"
              fullWidth
              onClick={() => onUpdateStatus(nextStatus)}
            >
              {ACTION_LABELS[order.status]}
            </ActionButton>
          )}
          {canCancel && (
            <ActionButton
              variant="destructive"
              fullWidth
              onClick={onCancel}
            >
              Cancel Order
            </ActionButton>
          )}
          {canDelete && (
            <ActionButton
              variant="muted"
              fullWidth
              onClick={onDelete}
            >
              Delete Order
            </ActionButton>
          )}
        </div>
      )}
    </CardPanel>
  );
};

export default OrderCard;
