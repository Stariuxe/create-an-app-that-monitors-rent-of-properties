import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Completes the first-login onboarding after Supabase has established a session.
 * Existing members go straight to operations; new landlords receive a private
 * workspace and membership through the database's auth-checked RPC.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    return NextResponse.redirect(new URL("/login?error=auth_callback", request.url));
  }

  const { data: memberships, error: membershipError } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .limit(1);

  if (membershipError) {
    console.error("PropertyOS onboarding membership lookup failed:", membershipError.code);
    return NextResponse.redirect(new URL("/dashboard?error=workspace_setup", request.url));
  }

  if (memberships?.length) {
    const response = NextResponse.redirect(new URL("/dashboard/operations", request.url));
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    return response;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .maybeSingle();

  const emailName = String(claimsData.claims.email ?? "").split("@")[0];
  const baseName = (profile?.full_name?.trim() || emailName || "My").slice(0, 84);
  const { data: organizationId, error: workspaceError } = await supabase.rpc(
    "create_workspace_for_current_user",
    { p_name: `${baseName} Properties` }
  );

  if (workspaceError || !organizationId) {
    console.error("PropertyOS automatic workspace setup failed:", workspaceError?.code ?? "empty_result");
    return NextResponse.redirect(new URL("/dashboard?error=workspace_setup", request.url));
  }

  const response = NextResponse.redirect(new URL("/dashboard/operations", request.url));
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  return response;
}
