export type StaffPermission = "kitchen" | "manager" | "admin";

export function isPathAllowedForPermission(path: string, permission: StaffPermission | null): boolean {
  if (path.startsWith("/kitchen")) {
    return permission === "kitchen" || permission === "manager";
  }

  if (path.startsWith("/manager")) {
    return permission === "manager";
  }

  if (path.startsWith("/admin")) {
    return permission === "admin";
  }

  return true;
}
