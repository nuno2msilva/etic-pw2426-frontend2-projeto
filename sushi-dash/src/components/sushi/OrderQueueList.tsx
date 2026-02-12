/**
 * ==========================================================================
 * OrderQueueList — Displays active orders for a specific table
 * ==========================================================================
 *
 * Shows the customer their pending orders with:
 *   - Queue position (global, across all tables)
 *   - Items summary
 *   - Status badge (Queued / Preparing / Ready)
 *
 * This component only appears when the table has active orders.
 * Delivered orders are excluded from this view.
 *
 * Props:
 *   orders     — Active orders for this table
 *   allOrders  — All orders (for global queue position calculation)
 *   tableLabel — Display label of the table (e.g., "Table 3")
 *
 * ==========================================================================
 */

import type { Order } from "@/types/sushi";
import Badge from "./Badge";

interface OrderQueueListProps {
  orders: Order[];
  allOrders: Order[];
  tableLabel: string;
}

const STATUS_BADGE_VARIANT: Record<string, "accent" | "primary-soft" | "success"> = {
  queued: "accent",
  preparing: "primary-soft",
  ready: "success",
};

const STATUS_LABELS: Record<string, string> = {
  queued: "⏳ Queued",
  preparing: "🔥 Preparing",
  ready: "✅ Ready",
};

const OrderQueueList = ({ orders, allOrders, tableLabel }: OrderQueueListProps) => {
  const getQueuePosition = (orderId: string): number => {
    const globalQueue = allOrders.filter(
      (o) => o.status === "queued" || o.status === "preparing"
    );
    return globalQueue.findIndex((o) => o.id === orderId) + 1;
  };

  if (orders.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="text-lg font-display font-bold text-foreground mb-3">
        📋 Your Queue — {tableLabel}
      </h2>

      <div className="space-y-2">
        {orders.map((order) => {
          const position = getQueuePosition(order.id);
          const itemsSummary = order.items
            .map((i) => `${i.sushi.name} (${i.quantity}x)`)
            .join(", ");

          return (
            <div
              key={order.id}
              className="flex items-center justify-between rounded-lg border bg-card px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center">
                  #{position > 0 ? position : "—"}
                </span>
                <span className="text-muted-foreground text-sm">{itemsSummary}</span>
              </div>

              <Badge variant={STATUS_BADGE_VARIANT[order.status]} size="sm">
                {STATUS_LABELS[order.status]}
              </Badge>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderQueueList;
