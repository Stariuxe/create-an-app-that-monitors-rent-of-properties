import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * A signup role is an onboarding preference, never an authorization grant.
 * Only the landlord's own workspace is created here. Tenant and agent access
 * still requires a real invitation/membership enforced by database policies.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  const userId = claims?.sub;

  if (claimsError || !userId) {
    return NextResponse.redirect(new URL("/login?error=auth_callback", request.url));
  }

  const { data: memberships, error: membershipError } = await supabase
    .from("organization_members").select("organization_id").eq("user_id", userId).limit(1);

  if (membershipError) {
    console.error("PropertyOS onboarding membership lookup failed:", membershipError.code);
    return NextResponse.redirect(new URL("/dashboard?error=workspace_setup", request.url));
  }
  if (memberships?.length) {
    const response = NextResponse.redirect(new URL("/dashboard/operations", request.url));
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    return response;
  }

  const accountType = claims?.user_metadata?.account_type;
  if (accountType === "tenant" || accountType === "property_manager") {
    // No identity-document request: tenants and managers wait for an authorised property invitation.
    return NextResponse.redirect(new URL("/dashboard?notice=awaiting_invitation", request.url));
  }

  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle();
  const emailName = String(claims?.email ?? "").split("@")[0];
  const baseName = (profile?.full_name?.trim() || emailName || "My").slice(0, 84);
  const { data: organizationId, error: workspaceError } = await supabase.rpc(
    "create_workspace_for_current_user", { p_name: `${baseName} Properties` }
  );

  if (workspaceError || !organizationId) {
    console.error("PropertyOS automatic workspace setup failed:", workspaceError?.code ?? "empty_result");
    return NextResponse.redirect(new URL("/dashboard?error=workspace_setup", request.url));
  }
  const response = NextResponse.redirect(new URL("/dashboard/operations", request.url));
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  return response;
}
