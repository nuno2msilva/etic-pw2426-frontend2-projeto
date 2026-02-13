/**
 * OrderProgressModal.tsx
 * ---------------------------------------------------------------------------
 * Shared order progress dialog used by both CustomerPage and TablePage.
 * Displays active orders with queue position, status badge, and cancel button.
 *
 * Props:
 * @prop {boolean}  open           — Controls dialog visibility.
 * @prop {Function} onOpenChange   — Toggle open state.
 * @prop {Order[]}  orders         — Active orders for the table.
 * @prop {Order[]}  allOrders      — All orders (for queue position calc).
 * @prop {Function} onCancelOrder  — Called with orderId when cancel is clicked.
 * ---------------------------------------------------------------------------
 */

import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { STATUS_BADGE_VARIANT, STATUS_LABELS } from "@/lib/order-status";

import type { Order } from "@/types/sushi";

interface OrderProgressModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orders: Order[];
  allOrders: Order[];
  onCancelOrder: (orderId: string) => void;
}

export const OrderProgressModal = ({
  open,
  onOpenChange,
  orders,
  allOrders,
  onCancelOrder,
}: OrderProgressModalProps) => {
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

  const getQueuePosition = (orderId: string): number => {
    const globalQueue = allOrders.filter(
      (o) => o.status === "queued" || o.status === "preparing"
    );
    return globalQueue.findIndex((o) => o.id === orderId) + 1;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg">📋 Order Progress</DialogTitle>
          </DialogHeader>

          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No pending orders yet. Start picking items!
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {orders.map((order) => {
                const position = getQueuePosition(order.id);
                const itemsSummary = order.items
                  .map((i) => `${i.sushi.name} (${i.quantity}x)`)
                  .join(", ");

                return (
                  <div
                    key={order.id}
                    className="flex items-center justify-between rounded-lg border bg-card px-3 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                        #{position > 0 ? position : "—"}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {itemsSummary}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 ml-2 shrink-0">
                      <Badge variant={STATUS_BADGE_VARIANT[order.status]} size="sm">
                        {STATUS_LABELS[order.status]}
                      </Badge>
                      {order.status === "queued" && (
                        <button
                          onClick={() => setCancellingOrderId(order.id)}
                          className="text-xs text-destructive hover:text-destructive/80 transition-colors font-medium px-1.5 py-0.5 rounded hover:bg-destructive/10"
                          title="Cancel order"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Order Confirmation */}
      <Dialog
        open={!!cancellingOrderId}
        onOpenChange={(dialogOpen) => !dialogOpen && setCancellingOrderId(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this order? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancellingOrderId(null)}>
              Keep
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (cancellingOrderId) {
                  onCancelOrder(cancellingOrderId);
                  toast.info("Order cancelled");
                }
                setCancellingOrderId(null);
              }}
            >
              Cancel Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OrderProgressModal;
