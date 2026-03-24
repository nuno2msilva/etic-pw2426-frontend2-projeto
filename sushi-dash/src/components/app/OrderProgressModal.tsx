// OrderProgressModal — Shared dialog showing active orders with queue position, status badge, and cancel support.

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

import type { Order } from "@/types/models";

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
        <DialogContent className="w-[calc(100vw-2rem)] max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">📋 Order Progress</DialogTitle>
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
                  .map((i) => `${i.item.name} (${i.quantity}x)`)
                  .join(", ");

                return (
                  <div
                    key={order.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-lg border bg-card px-3 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                        #{position > 0 ? position : "—"}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {itemsSummary}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
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
