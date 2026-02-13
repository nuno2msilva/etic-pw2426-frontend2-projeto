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
import { useState } from "react";
import { Card } from "@/components/ui/card";
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

interface OrderCardProps {
  order: Order;
  onUpdateStatus?: (status: OrderStatus) => void;
  onCancel?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

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

  // Confirmation dialog state
  const [confirmAction, setConfirmAction] = useState<"cancel" | "delete" | null>(null);

  const handleConfirm = () => {
    if (confirmAction === "cancel" && onCancel) onCancel();
    if (confirmAction === "delete" && onDelete) onDelete();
    setConfirmAction(null);
  };

  return (
    <Card variant="section" className="p-4">
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
            <Button
              className="w-full"
              onClick={() => onUpdateStatus(nextStatus)}
            >
              {ACTION_LABELS[order.status]}
            </Button>
          )}
          {canCancel && (
            <Button
              variant="destructive-soft"
              className="w-full"
              onClick={() => setConfirmAction("cancel")}
            >
              Cancel Order
            </Button>
          )}
          {canDelete && (
            <Button
              variant="muted"
              className="w-full"
              onClick={() => setConfirmAction("delete")}
            >
              Delete Order
            </Button>
          )}
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {confirmAction === "cancel" ? "Cancel Order" : "Delete Order"}
            </DialogTitle>
            <DialogDescription>
              {confirmAction === "cancel"
                ? `Are you sure you want to cancel the order for ${order.table.label}? This cannot be undone.`
                : `Are you sure you want to delete the order for ${order.table.label}? This cannot be undone.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAction(null)}>
              Keep
            </Button>
            <Button variant="destructive" onClick={handleConfirm}>
              {confirmAction === "cancel" ? "Cancel Order" : "Delete Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default OrderCard;
