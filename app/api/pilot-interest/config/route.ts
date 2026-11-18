import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? process.env.NEXT_2_TURNSTILE_SITE_KEY ?? "";
  return NextResponse.json({ siteKey }, { headers: { "Cache-Control": "no-store" } });
}
