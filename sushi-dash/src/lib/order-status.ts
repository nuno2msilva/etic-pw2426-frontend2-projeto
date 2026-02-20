// order-status.ts — Shared order-status display maps used by OrderCard and OrderProgressModal. Keeps the badge variant + emoji label in one place so they stay in sync.

import type { OrderStatus } from "@/types/models";

export const STATUS_BADGE_VARIANT: Record<
  OrderStatus,
  "accent" | "primary-soft" | "success" | "muted" | "destructive"
> = {
  queued: "accent",
  preparing: "primary-soft",
  ready: "success",
  delivered: "muted",
  cancelled: "destructive",
};

export const STATUS_LABELS: Record<OrderStatus, string> = {
  queued: "⏳ Queued",
  preparing: "🔥 Preparing",
  ready: "✅ Ready",
  delivered: "🎉 Delivered",
  cancelled: "❌ Cancelled",
};
