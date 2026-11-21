import { NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

const allowedTypes: EmailOtpType[] = ["signup", "email", "invite", "magiclink", "recovery", "email_change"];

function getSafeDestination(value: string | null, origin: string, fallback: string) {
  if (!value) return new URL(fallback, origin);
  try {
    const destination = new URL(value, origin);
    if (destination.origin !== origin) return new URL(fallback, origin);
    return destination;
  } catch {
    return new URL(fallback, origin);
  }
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const rawType = searchParams.get("type");
  const type = rawType && allowedTypes.includes(rawType as EmailOtpType) ? rawType as EmailOtpType : null;
  const fallback = type === "recovery" ? "/update-password" : "/dashboard";
  const destination = getSafeDestination(searchParams.get("next"), origin, fallback);
  destination.searchParams.delete("token_hash");
  destination.searchParams.delete("type");
  destination.searchParams.delete("code");

  const supabase = await createClient();
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  let error: { message: string; code?: string } | null = null;

  if (code) {
    ({ error } = await supabase.auth.exchangeCodeForSession(code));
  } else if (tokenHash && type) {
    ({ error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type }));
  } else {
    return NextResponse.redirect(new URL("/login?error=confirmation", origin));
  }

  if (error) {
    console.error("PropertyOS email confirmation failed:", error.code ?? "auth_error");
    return NextResponse.redirect(new URL("/login?error=confirmation", origin));
  }

  const response = NextResponse.redirect(destination);
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  return response;
}
