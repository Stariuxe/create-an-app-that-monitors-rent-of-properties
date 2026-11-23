import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createWorkspace, signOut } from "./actions";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const { error: errorCode, notice } = await searchParams;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/login?next=%2Fdashboard");

  const [{ data: profile }, { data: memberships, error: membershipError }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle(),
    supabase.from("organization_members").select("role, organizations(id, name)").eq("user_id", userId),
  ]);
  if (membershipError) {
    console.error("PropertyOS membership lookup failed:", membershipError.code);
  }

  const roles = (memberships ?? []).map((item: any) => String(item.role));
  const staffRoles = new Set(["landlord", "property_manager", "accountant", "caretaker", "platform_admin"]);
  if (roles.some((role) => staffRoles.has(role))) redirect("/dashboard/operations");
  if (roles.includes("tenant")) redirect("/tenant-portal");
  if (roles.length) redirect("/dashboard?error=role_unavailable");

  const accountType = claimsData?.claims?.user_metadata?.account_type;
  if (accountType === "tenant") redirect("/tenant-portal?notice=awaiting_invitation");
  if (accountType === "property_manager") {
    // Managers must be invited into an organisation; never create a landlord workspace for them.
  }

  // First successful visit after signup/sign-in automatically provisions the
  // landlord's private workspace. The database RPC validates auth.uid() and
  // creates the organization + landlord membership atomically.
  let automaticWorkspaceError = false;
  if (!membershipError && !memberships?.length && accountType !== "tenant" && accountType !== "property_manager") {
    const emailName = String(claimsData?.claims?.email ?? "").split("@")[0];
    const baseName = (profile?.full_name?.trim() || emailName || "My").slice(0, 84);
    const workspaceName = `${baseName} Properties`;
    const { data: workspaceId, error: workspaceError } = await supabase.rpc(
      "create_workspace_for_current_user",
      { p_name: workspaceName }
    );
    if (!workspaceError && workspaceId) redirect("/dashboard/operations");
    automaticWorkspaceError = true;
    console.error("PropertyOS automatic workspace provisioning failed:", workspaceError?.code ?? "empty_result");
  }

  const errorText = automaticWorkspaceError ? "Your account is active, but automatic workspace setup needs one more step. You can create it below."
    : membershipError ? "We could not verify your workspace membership. Refresh the page; if the problem continues, sign out and sign in again."
    : errorCode === "create" ? "Could not create the workspace. Please try again."
    : errorCode === "membership" ? "Workspace created, but membership setup needs support."
    : errorCode === "auth" ? "Your sign-in session could not be verified. Please sign in again."
    : errorCode === "permission" ? "Your account is signed in, but the workspace permission check failed. Please sign out and sign in again."
    : errorCode === "workspace" ? "Enter a workspace name between 2 and 100 characters."
    : errorCode === "role_unavailable" ? "Your account has a membership, but its role does not have a workspace destination yet. Contact your property administrator."
    : notice === "awaiting_invitation" ? "Your account is registered. A landlord or authorised property manager must invite you before you can access a property workspace."
    : accountType === "property_manager" ? "Your property manager account is waiting for an authorised organisation invitation. No landlord workspace has been created."
    : "";

  return (
    <main style={{ minHeight: "100vh", background: "radial-gradient(ellipse at 12% 0%,rgba(175,211,192,.35),transparent 34%),radial-gradient(ellipse at 92% 18%,rgba(184,205,196,.34),transparent 30%),linear-gradient(135deg,#f3f5ef,#e9eee8 55%,#f4f3ed)", color: "#132c2a", padding: "32px 6%" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, background: "rgba(247,249,245,.72)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", border: "1px solid rgba(255,255,255,.8)", borderRadius: 14, boxShadow: "0 8px 28px rgba(19,44,42,.06)", padding: "14px 16px" }}>
        <a href="/" style={{ fontWeight: 800, fontSize: 20 }}>PropertyOS <span style={{ color: "#639b86" }}>AI</span></a>
        <a href="/business-tools" style={{ color: "#183b32", fontSize: 13, fontWeight: 700, marginRight: 14 }}>Business tools →</a><form action={signOut}><button type="submit" style={{ border: "1px solid #bdcbc0", borderRadius: 6, padding: "9px 14px", background: "transparent", color: "#183b32" }}>Sign out</button></form>
      </header>
      <section style={{ maxWidth: 900, margin: "56px auto" }}>
        <p style={{ color: "#6d9e8b", fontSize: 11, letterSpacing: 2 }}>LANDLORD WORKSPACE</p>
        <h1 style={{ fontSize: 42, letterSpacing: -2, margin: "12px 0" }}>Welcome{profile?.full_name ? `, ${profile.full_name}` : ""}.</h1>
        <p style={{ color: "#687573", lineHeight: 1.7 }}>Your secure account is connected. Create a workspace for your property portfolio to get started.</p>
        {errorText && <p role="alert" style={{ padding: 12, background: "#f9e8e2", color: "#8a3829", borderRadius: 6 }}>{errorText}</p>}
        {accountType === "property_manager" ? (
          <div role="status" style={{ marginTop: 32, padding: 24, background: "rgba(255,255,255,.72)", border: "1px solid #dce4dc", borderRadius: 16 }}>
            <h2 style={{ marginTop: 0 }}>Invitation required</h2>
            <p style={{ color: "#687573", lineHeight: 1.7 }}>Your property manager account is ready. Ask the landlord or organisation owner to invite this email address. PropertyOS will open your assigned workspace after the invitation is accepted.</p>
          </div>
        ) : (
        <div style={{ marginTop: 32, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 18 }}>
          <article style={{ padding: 24, background: "rgba(255,255,255,.68)", backdropFilter: "blur(18px) saturate(150%)", WebkitBackdropFilter: "blur(18px) saturate(150%)", border: "1px solid rgba(255,255,255,.82)", boxShadow: "0 14px 38px rgba(19,44,42,.08),inset 0 1px 0 rgba(255,255,255,.9)", borderRadius: 16 }}>
            <h2 style={{ marginTop: 0 }}>Create your workspace</h2>
            <p style={{ color: "#687573", fontSize: 13, lineHeight: 1.6 }}>Use your business or portfolio name. You can invite your team after the workspace setup is complete.</p>
            <form action={createWorkspace}>
              <label htmlFor="workspace" style={{ display: "block", fontSize: 12, marginBottom: 8 }}>Workspace name</label>
              <input id="workspace" name="name" required minLength={2} maxLength={100} placeholder="e.g. Stariuxe Properties" style={{ width: "100%", padding: 12, border: "1px solid #cfd9d0", borderRadius: 6, marginBottom: 12 }} />
              <button type="submit" style={{ width: "100%", padding: 13, border: 0, borderRadius: 6, background: "#183b32", color: "#fff", fontWeight: 700 }}>Create workspace →</button>
            </form>
          </article>
          <article style={{ padding: 24, background: "#fff", border: "1px solid #dce4dc", borderRadius: 10 }}>
            <h2 style={{ marginTop: 0 }}>Your workspaces</h2>
            {memberships?.length ? <ul style={{ paddingLeft: 18, lineHeight: 2 }}>{memberships.map((item: any) => {
              const org = Array.isArray(item.organizations) ? item.organizations[0] : item.organizations;
              return <li key={org?.id}>{org?.name} <small style={{ color: "#6d9e8b" }}>· {item.role}</small></li>;
            })}</ul> : <p style={{ color: "#687573", fontSize: 13 }}>No workspace yet. Create one to begin.</p>}
          </article>
        </div>
        <div style={{ marginTop: 30, padding: 22, background: "rgba(255,255,255,.58)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", border: "1px solid rgba(255,255,255,.78)", boxShadow: "0 12px 30px rgba(19,44,42,.06)", borderRadius: 16 }}><h2 style={{ marginTop: 0 }}>Manage your portfolio</h2><p style={{ color: "#687573", lineHeight: 1.6 }}>Add properties, units, tenants, leases and rent charges. Review live records and outstanding balances in your workspace.</p><a href="/dashboard/operations" style={{ display: "inline-block", padding: "12px 18px", background: "#183b32", color: "#fff", borderRadius: 6, textDecoration: "none", fontWeight: 700 }}>Open property operations →</a></div>
        )}
      </section>
    </main>
  );
}
