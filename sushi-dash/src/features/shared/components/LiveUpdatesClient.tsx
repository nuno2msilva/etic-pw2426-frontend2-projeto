"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/features/shared/context/AuthContext";
import { usePresencePolling, useServerEvents } from "@/features/shared/hooks/useServerEvents";

function resolvePresenceTableId(
  authenticatedTableId: string | null,
  hasStaffSession: boolean,
): string | null {
  return hasStaffSession ? null : authenticatedTableId;
}

export default function LiveUpdatesClient() {
  const { authenticatedTableId, staffSession, logout, isViewingTableSelection } = useAuth();
  const pathname = usePathname();
  const presenceTableId = resolvePresenceTableId(authenticatedTableId, Boolean(staffSession));
  const isAuthenticated = Boolean(authenticatedTableId || staffSession);

  const shouldPollPresence = Boolean(pathname?.startsWith("/manager"));

  // Don't maintain SSE presence when customer is at table selection (temporarily closes connection)
  const effectiveTableId = isViewingTableSelection ? null : presenceTableId;

  useServerEvents({
    tableId: effectiveTableId,
    onEjected: logout,
    enabled: isAuthenticated,
  });

  usePresencePolling(shouldPollPresence);

  return null;
}