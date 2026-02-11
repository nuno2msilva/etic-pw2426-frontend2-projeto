/**
 * ==========================================================================
 * KitchenPage — Kitchen staff order dashboard
 * ==========================================================================
 *
 * Shows all incoming orders for kitchen staff to process.
 * Orders flow through: Queued → Preparing → Ready → Delivered.
 *
 * Security:
 *   - Password-protected via LoginModal (kitchen password)
 *   - Third-party users can close the modal and see "Access Denied"
 *   - Access denied screen offers navigation back to table selection
 *
 * Route: /kitchen
 * Auth: Kitchen password required
 * ==========================================================================
 */

import { useState, useMemo, useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSushi } from "@/context/SushiContext";
import { useAuth } from "@/context/AuthContext";
import { OrderCard, SEOHead } from "@/components/sushi";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
const KitchenPage = () => {
  const { orders, updateOrderStatus, cancelOrder, deleteOrder } = useSushi();
  const { isInitialized, checkAccess, logout } = useAuth();
  const navigate = useNavigate();

  // Check if user has kitchen access
  const hasKitchenAccess = checkAccess('kitchen');
  
  // Check if user is manager (has extra permissions)
  const isManager = checkAccess('manager');

  // Redirect to staff login if not authenticated
  useEffect(() => {
    if (isInitialized && !hasKitchenAccess) {
      navigate('/staff');
    }
  }, [isInitialized, hasKitchenAccess, navigate]);

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

  // Show loading or redirect while auth initializes
  if (!isInitialized || !hasKitchenAccess) {
    return null; // useEffect will handle redirect
  }

  // Redirect to /staff if not authenticated (handled by useEffect)
  if (!hasKitchenAccess) {
    return null;
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <SEOHead
        title="Kitchen Dashboard"
        description="Process incoming sushi orders. View active and delivered orders in real time."
      />
      {/* Page Header */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-display font-bold text-foreground">
          🔥 Kitchen Dashboard
        </h1>
        <div className="flex items-center gap-3">
          {isManager && (
            <Link
              to="/manager"
              className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
            >
              Manager Settings →
            </Link>
          )}
          <button
            onClick={logout}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
      <p className="text-muted-foreground mb-8">
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
        <section className="mb-8">
          <h2 className="text-lg font-bold text-foreground mb-4">
            Active Orders ({activeOrders.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <h2 className="text-lg font-bold text-muted-foreground mb-4">
            Completed ({completedOrders.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-60">
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
