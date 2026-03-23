import { NextResponse } from "next/server";

function backendBaseUrl(): string {
  return process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
}

export async function GET() {
  try {
    const response = await fetch(`${backendBaseUrl()}/api/health`, {
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
    });

    const text = await response.text();
    return new NextResponse(text, {
      status: response.status,
      headers: { "Content-Type": response.headers.get("content-type") || "application/json" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Backend health check failed" },
      { status: 502 },
    );
  }
}
