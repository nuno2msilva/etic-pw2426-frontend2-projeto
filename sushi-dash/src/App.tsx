/**
 * ==========================================================================
 * App.tsx — Root component & provider tree
 * ==========================================================================
 *
 * Sets up the full provider hierarchy:
 *   1. QueryClientProvider — React Query cache & data fetching
 *   2. TooltipProvider — Radix UI tooltip context
 *   3. Sonner — Toast notification system
 *   4. AuthProvider — Authentication state (sessions, role checks)
 *   5. SushiProvider — Application data (menu, tables, orders, settings)
 *   6. BrowserRouter — Client-side routing
 *
 * Routes:
 *   /              → Landing page with table selection
 *   /table/:tableId → Customer ordering page (no password)
 *   /kitchen       → Kitchen dashboard (password protected)
 *   /manager       → Management panel (password protected)
 *   *              → 404 Not Found
 *
 * ==========================================================================
 */

import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SushiProvider } from "@/context/SushiContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { useServerEvents } from "@/hooks/useServerEvents";
import AppHeader from "@/components/sushi/AppHeader";
import CustomerPage from "./pages/CustomerPage";
import TablePage from "./pages/TablePage";
import KitchenPage from "./pages/KitchenPage";
import ManagerPage from "./pages/ManagerPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

/**
 * Invisible component that keeps a single SSE connection alive.
 * Handles cache invalidation for live data and customer ejection
 * (when manager changes a table PIN or deletes a table).
 */
function LiveUpdates() {
  const { authenticatedTableId, logout } = useAuth();
  useServerEvents({
    tableId: authenticatedTableId,
    onEjected: logout,
  });
  return null;
}

/**
 * Main App with routing:
 * - / : Landing page with table selection links
 * - /table/:tableId : Customer ordering for specific table (no password)
 * - /kitchen : Kitchen view (password protected, closable modal)
 * - /manager : Manager panel (password protected)
 */
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <AuthProvider>
        <LiveUpdates />
        <SushiProvider>
          <BrowserRouter>
            <AppHeader />
            <Routes>
              <Route path="/" element={<CustomerPage />} />
              <Route path="/table/:tableId" element={<TablePage />} />
              <Route path="/kitchen" element={<KitchenPage />} />
              <Route path="/manager" element={<ManagerPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </SushiProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
