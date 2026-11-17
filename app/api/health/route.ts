import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Lightweight liveness endpoint for uptime monitors.
 * Deliberately returns no environment values, credentials, or tenant data.
 */
export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "propertyos-ai-web",
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}
