import { NextRequest, NextResponse } from "next/server";
import { isPathAllowedForPermission, type StaffPermission } from "./src/lib/route-permissions";

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return null;
    const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const binary = atob(padded);
    const json = decodeURIComponent(
      Array.from(binary)
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join(""),
    );
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function getStaffPermission(req: NextRequest): StaffPermission | null {
  const token = req.cookies.get("sushi_staff")?.value;
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  const permission = payload?.permission;
  if (permission === "kitchen" || permission === "manager" || permission === "admin") {
    return permission;
  }
  return null;
}

function denyToLastPage(req: NextRequest): NextResponse {
  const referer = req.headers.get("referer");
  if (referer) {
    const refererUrl = new URL(referer);
    if (refererUrl.origin === req.nextUrl.origin) {
      return NextResponse.redirect(refererUrl);
    }
  }
  return NextResponse.redirect(new URL("/", req.url));
}

export function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const permission = getStaffPermission(req);

  if (!isPathAllowedForPermission(path, permission)) {
    return denyToLastPage(req);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/kitchen/:path*", "/manager/:path*", "/admin/:path*"],
};
