import { NextRequest, NextResponse } from "next/server";

type WebVitalPayload = {
  id: string;
  name: "FCP" | "LCP" | "CLS" | "FID" | "INP" | "TTFB";
  value: number;
  rating?: "good" | "needs-improvement" | "poor";
  navigationType?: string;
};

function isValidPayload(input: unknown): input is WebVitalPayload {
  if (!input || typeof input !== "object") return false;
  const payload = input as Record<string, unknown>;
  return (
    typeof payload.id === "string" &&
    typeof payload.name === "string" &&
    typeof payload.value === "number"
  );
}

export async function POST(req: NextRequest) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isValidPayload(body)) {
    return NextResponse.json({ error: "Invalid web-vitals payload" }, { status: 422 });
  }

  // In production this can be forwarded to analytics providers.
  console.log("[web-vitals]", body);

  return NextResponse.json({ ok: true });
}
