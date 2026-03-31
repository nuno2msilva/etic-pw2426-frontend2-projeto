import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/shared/context/AuthContext";
import { hasStaffPermission, type Permission, type AuthSession } from "@/features/shared/lib/auth";

interface ProtectedStaffRouteResult {
  isInitialized: boolean;
  staffSession: AuthSession | null;
  hasAccess: boolean;
}

/**
 * Shared guard for staff-only pages.
 * Redirects unauthorized users back/home while exposing access flags to callers.
 */
export function useProtectedStaffRoute(requiredPermission: Permission): ProtectedStaffRouteResult {
  const { isInitialized, staffSession } = useAuth();
  const router = useRouter();
  const hasAccess = hasStaffPermission(staffSession, requiredPermission);

  useEffect(() => {
    if (isInitialized && !hasAccess) {
      if (typeof window !== "undefined" && window.history.length > 1) {
        router.back();
      } else {
        router.replace("/");
      }
    }
  }, [isInitialized, hasAccess, router]);

  return {
    isInitialized,
    staffSession,
    hasAccess,
  };
}
