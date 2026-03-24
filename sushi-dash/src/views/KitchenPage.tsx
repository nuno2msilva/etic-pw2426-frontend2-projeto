// KitchenPage — Password-protected kitchen dashboard for processing orders through their lifecycle.

"use client";

import { useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { hasStaffPermission } from "@/lib/auth";
import { OrderCard, SEOHead } from "@/components/app";
const KitchenPage = () => {
  const { orders, updateOrderStatus, cancelOrder, deleteOrder } = useApp();
  const { isInitialized, staffSession } = useAuth();
  const router = useRouter();

  // Route access: kitchen staff and managers can access /kitchen.
  const isManager = hasStaffPermission(staffSession, "manager");
  const hasKitchenAccess = hasStaffPermission(staffSession, "kitchen");

  // If unauthorized, go back to previous page (or home when no history is available).
  useEffect(() => {
    if (isInitialized && !hasKitchenAccess) {
      if (typeof window !== "undefined" && window.history.length > 1) {
        router.back();
      } else {
        router.replace("/");
      }
    }
  }, [isInitialized, hasKitchenAccess, router]);

  // useCallback — stable delete handler to prevent closure issues
  const handleDeleteOrder = useCallback(
    (orderId: string) => {
      deleteOrder(orderId);
    },
    [deleteOrder]
  );

  // useCallback — stable cancel handler
  const handleCancelOrder = useCallback(
    (orderId: string) => {
      cancelOrder(orderId);
    },
    [cancelOrder]
  );

  // useMemo — split orders into active vs completed (recalculates when orders change)
  const activeOrders = useMemo(
    () => orders.filter((o) => o.status !== "delivered" && o.status !== "cancelled"),
    [orders]
  );
  const completedOrders = useMemo(
    () => orders.filter((o) => o.status === "delivered" || o.status === "cancelled"),
    [orders]
  );

  const hasNoOrders = activeOrders.length === 0 && completedOrders.length === 0;

  // Wait for auth init; useEffect handles redirect if unauthorized
  if (!isInitialized || !hasKitchenAccess) return null;

  return (
    <main className="h-[100dvh] sm:h-full overflow-y-auto max-w-5xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
      <SEOHead
        title="Kitchen Dashboard"
        description="Process incoming sushi orders. View active and delivered orders in real time."
      />
      {/* Page Header */}
      <div className="mb-2">
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
          🔥 Kitchen Dashboard
        </h1>
      </div>
      <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8">
        Process orders in queue order.
      </p>

      {/* Empty State */}
      {hasNoOrders && (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-5xl mb-4">🍵</p>
          <p className="text-lg">No orders yet. Waiting for customers...</p>
        </div>
      )}

      {/* Active Orders Section */}
      {activeOrders.length > 0 && (
        <section className="mb-6 sm:mb-8">
          <h2 className="text-base sm:text-lg font-bold text-foreground mb-3 sm:mb-4">
            Active Orders ({activeOrders.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {activeOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                showActions
                onUpdateStatus={(status) => updateOrderStatus(order.id, status)}
                onCancel={isManager ? () => handleCancelOrder(order.id) : undefined}
              />
            ))}
          </div>
        </section>
      )}

      {/* Completed Orders Section (Delivered + Cancelled) */}
      {completedOrders.length > 0 && (
        <section>
          <h2 className="text-base sm:text-lg font-bold text-muted-foreground mb-3 sm:mb-4">
            Completed ({completedOrders.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 opacity-60">
            {completedOrders.map((order) => (
              <OrderCard 
                key={order.id} 
                order={order}
                showActions={isManager}
                onDelete={isManager ? () => handleDeleteOrder(order.id) : undefined}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
};

export default KitchenPage;
