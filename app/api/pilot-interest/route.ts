import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const json = (body: Record<string, unknown>, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
    if (!origin || !host || new URL(origin).host !== host) {
      return json({ error: "Request origin not allowed." }, 403);
    }

    const raw = await request.text();
    if (raw.length > 5000) return json({ error: "Request is too large." }, 413);
    const body = JSON.parse(raw) as Record<string, unknown>;

    // Quietly accept honeypot submissions without storing them.
    if (typeof body.companyWebsite === "string" && body.companyWebsite.trim()) {
      return json({ ok: true });
    }

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const token = typeof body.turnstileToken === "string" ? body.turnstileToken : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return json({ error: "Enter a valid email address." }, 400);
    }
    if (body.consent !== true) return json({ error: "Consent is required to submit a pilot enquiry." }, 400);
    if (!token) return json({ error: "Complete the security check and try again." }, 400);

    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY ?? process.env.TURNSTILE_SECRET_KEY_12_;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!turnstileSecret || !supabaseUrl || !serviceKey) {
      console.error("Pilot enquiry service is not configured.");
      return json({ error: "Pilot registration is temporarily unavailable. Please try again later." }, 503);
    }

    const verification = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret: turnstileSecret, response: token }),
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!verification.ok) return json({ error: "Security verification failed. Please try again." }, 400);
    const verificationResult = await verification.json() as { success?: boolean; hostname?: string };
    if (!verificationResult.success || verificationResult.hostname !== new URL(origin).hostname) {
      return json({ error: "Security verification failed. Please refresh the check and try again." }, 400);
    }

    const insert = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/pilot_leads?on_conflict=email_normalized`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "resolution=ignore-duplicates,return=minimal",
      },
      body: JSON.stringify({
        email,
        email_normalized: email,
        consent_at: new Date().toISOString(),
        consent_version: "pilot-contact-v1",
        source: "website",
      }),
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });

    if (!insert.ok) {
      console.error("Pilot enquiry insert failed with status:", insert.status);
      return json({ error: "We could not save your enquiry just now. Please try again later." }, 503);
    }
    return json({ ok: true });
  } catch (error) {
    console.error("Pilot enquiry request failed:", error instanceof Error ? error.message : "unknown error");
    return json({ error: "We could not process your enquiry. Please try again." }, 500);
  }
}
