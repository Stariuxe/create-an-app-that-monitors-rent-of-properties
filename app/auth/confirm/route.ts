import { NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

const allowedTypes: EmailOtpType[] = ["signup", "email", "invite", "magiclink", "recovery", "email_change"];

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const requestedNext = searchParams.get("next") || "/dashboard";
  // Only allow same-site relative destinations to prevent open redirects.
  const next = requestedNext.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/dashboard";
  const supabase = await createClient();

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const rawType = searchParams.get("type");
  let error: { message: string } | null = null;

  if (code) {
    ({ error } = await supabase.auth.exchangeCodeForSession(code));
  } else if (tokenHash && rawType && allowedTypes.includes(rawType as EmailOtpType)) {
    ({ error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: rawType as EmailOtpType }));
  } else {
    return NextResponse.redirect(new URL("/login?error=confirmation", origin));
  }

  if (error) {
    return NextResponse.redirect(new URL("/login?error=confirmation", origin));
  }

  return NextResponse.redirect(new URL(next, origin));
}
