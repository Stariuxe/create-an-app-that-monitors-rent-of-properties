import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

const allowedTypes: EmailOtpType[] = ["signup", "email", "invite", "magiclink", "recovery", "email_change"];

function safeNext(value: string | null, origin: string, fallback: string) {
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
  const url = new URL(request.url);
  const rawType = url.searchParams.get("type");
  const type = rawType && allowedTypes.includes(rawType as EmailOtpType) ? rawType as EmailOtpType : null;
  const fallback = type === "recovery" ? "/update-password" : "/dashboard";
  const destination = safeNext(url.searchParams.get("next"), url.origin, fallback);
  destination.searchParams.delete("code");
  destination.searchParams.delete("token_hash");
  destination.searchParams.delete("type");

  const supabase = await createClient();
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  let error: { message: string; code?: string } | null = null;

  if (code) {
    ({ error } = await supabase.auth.exchangeCodeForSession(code));
  } else if (tokenHash && type) {
    ({ error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type }));
  } else {
    return NextResponse.redirect(new URL("/login?error=auth_callback", url.origin));
  }

  if (error) {
    console.error("PropertyOS auth callback failed:", error.code ?? "auth_error");
    return NextResponse.redirect(new URL("/login?error=auth_callback", url.origin));
  }

  const response = NextResponse.redirect(destination);
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  return response;
}
