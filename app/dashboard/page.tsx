import { createClient } from "@/lib/supabase/server";
import { createWorkspace, signOut } from "./actions";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error: errorCode } = await searchParams;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return null;

  const [{ data: profile }, { data: memberships }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle(),
    supabase.from("organization_members").select("role, organizations(id, name)").eq("user_id", userId),
  ]);

  const errorText = errorCode === "create" ? "Could not create the workspace. Please try again."
    : errorCode === "membership" ? "Workspace created, but membership setup needs support."
    : errorCode === "workspace" ? "Enter a workspace name between 2 and 100 characters." : "";

  return (
    <main style={{ minHeight: "100vh", background: "#f3f2ec", color: "#132c2a", padding: "32px 6%" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, borderBottom: "1px solid #d8dfd6", paddingBottom: 20 }}>
        <a href="/" style={{ fontWeight: 800, fontSize: 20 }}>PropertyOS <span style={{ color: "#639b86" }}>AI</span></a>
        <form action={signOut}><button type="submit" style={{ border: "1px solid #bdcbc0", borderRadius: 6, padding: "9px 14px", background: "transparent", color: "#183b32" }}>Sign out</button></form>
      </header>
      <section style={{ maxWidth: 900, margin: "56px auto" }}>
        <p style={{ color: "#6d9e8b", fontSize: 11, letterSpacing: 2 }}>LANDLORD WORKSPACE</p>
        <h1 style={{ fontSize: 42, letterSpacing: -2, margin: "12px 0" }}>Welcome{profile?.full_name ? `, ${profile.full_name}` : ""}.</h1>
        <p style={{ color: "#687573", lineHeight: 1.7 }}>Your secure account is connected. Create a workspace for your property portfolio to get started.</p>
        {errorText && <p role="alert" style={{ padding: 12, background: "#f9e8e2", color: "#8a3829", borderRadius: 6 }}>{errorText}</p>}
        <div style={{ marginTop: 32, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 18 }}>
          <article style={{ padding: 24, background: "#fff", border: "1px solid #dce4dc", borderRadius: 10 }}>
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
        <div style={{ marginTop: 30, padding: 22, background: "#e7eee7", borderRadius: 10 }}><h2 style={{ marginTop: 0 }}>Manage your portfolio</h2><p style={{ color: "#687573", lineHeight: 1.6 }}>Add properties, units, tenants, leases and rent charges. Review live records and outstanding balances in your workspace.</p><a href="/dashboard/operations" style={{ display: "inline-block", padding: "12px 18px", background: "#183b32", color: "#fff", borderRadius: 6, textDecoration: "none", fontWeight: 700 }}>Open property operations →</a></div>
      </section>
    </main>
  );
}
