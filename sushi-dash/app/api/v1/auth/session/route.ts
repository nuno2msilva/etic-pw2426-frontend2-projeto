import { NextRequest, NextResponse } from "next/server";

function backendBaseUrl(): string {
  return process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
}

export async function GET(req: NextRequest) {
  try {
    const response = await fetch(`${backendBaseUrl()}/api/auth/session`, {
      cache: "no-store",
      headers: {
        cookie: req.headers.get("cookie") || "",
        "Content-Type": "application/json",
      },
    });

    const text = await response.text();
    return new NextResponse(text, {
      status: response.status,
      headers: { "Content-Type": response.headers.get("content-type") || "application/json" },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch auth session" },
      { status: 502 },
    );
  }
}
