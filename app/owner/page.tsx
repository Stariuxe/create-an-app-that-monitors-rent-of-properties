import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const ownerEmails = (process.env.PROPERTYOS_OWNER_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

const card: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #dce4dc",
  borderRadius: 14,
  padding: 22,
  boxShadow: "0 8px 28px rgba(19,44,42,.04)",
};

async function checkWebsite() {
  try {
    const response = await fetch("https://propertyosai.cc.cd/", {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export default async function OwnerControlCentre() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const userId = claims?.sub;
  const email = String(claims?.email ?? "").trim().toLowerCase();

  if (!userId) redirect("/login?next=%2Fowner");

  // Fail closed: only explicitly allowlisted owner email addresses can enter.
  if (!email || !ownerEmails.includes(email)) {
    return (
      <main style={{ minHeight: "100vh", background: "#f3f2ec", color: "#132c2a", padding: "8vh 7%" }}>
        <div style={{ maxWidth: 680, margin: "auto", ...card }}>
          <p style={{ color: "#6d9e8b", letterSpacing: 2, fontSize: 11 }}>STARIUXE ENTERPRISES / PRIVATE</p>
          <h1>Owner access is not configured.</h1>
          <p style={{ lineHeight: 1.7, color: "#687573" }}>Your account is signed in, but it is not on the owner access list. The administrator must add the owner's sign-in email to the Vercel environment variable <code>PROPERTYOS_OWNER_EMAILS</code> for Production and Preview, then redeploy. Multiple owners can be separated with commas.</p>
          <a href="/dashboard" style={{ color: "#246b55" }}>Return to PropertyOS AI</a>
        </div>
      </main>
    );
  }

  const { data: memberships, error: membershipError } = await supabase
    .from("organization_members")
    .select("organization_id, role, organizations(name)")
    .eq("user_id", userId);

  const membership = memberships?.[0];
  const organizationId = membership?.organization_id;
  const organizationValue = membership?.organizations;
  const organization = Array.isArray(organizationValue) ? organizationValue[0] : organizationValue;

  const metric = async (table: string) => {
    if (!organizationId) return null;
    const result = await supabase.from(table).select("id", { count: "exact", head: true }).eq("organization_id", organizationId);
    return result.error ? null : result.count ?? 0;
  };

  const [websiteUp, properties, units, tenants, leases, rentCharges, payments] = await Promise.all([
    checkWebsite(),
    metric("properties"),
    metric("units"),
    metric("tenants"),
    metric("leases"),
    metric("rent_charges"),
    metric("payments"),
  ]);

  const metrics = [
    ["Properties", properties],
    ["Units", units],
    ["Tenants", tenants],
    ["Leases", leases],
    ["Rent charges", rentCharges],
    ["Payment records", payments],
  ] as const;

  const systems = [
    ["Public website", websiteUp ? "Reachable" : "Needs checking", websiteUp],
    ["Supabase session", "Authenticated", true],
    ["Workspace membership", membershipError ? "Could not verify" : organizationId ? "Connected" : "No workspace found", Boolean(organizationId && !membershipError)],
    ["M-Pesa mode", process.env.MPESA_ENVIRONMENT === "sandbox" ? "Sandbox" : "Not verified as sandbox", process.env.MPESA_ENVIRONMENT === "sandbox"],
    ["Turnstile keys", process.env.NEXT_2_TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY_12_ ? "Variables present" : "Needs configuration", Boolean(process.env.NEXT_2_TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY_12_)],
    ["Supabase server key", process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY ? "Server variable present" : "Needs configuration", Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY)],
  ] as const;

  return (
    <main style={{ minHeight: "100vh", background: "#f3f2ec", color: "#132c2a", padding: "28px 5%" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap", borderBottom: "1px solid #d8dfd6", paddingBottom: 20 }}>
          <div>
            <p style={{ color: "#6d9e8b", fontSize: 10, letterSpacing: 2, margin: 0 }}>STARIUXE ENTERPRISES</p>
            <h1 style={{ fontSize: 25, margin: "6px 0 0" }}>Owner Control Centre</h1>
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <a href="/owner/business" style={{ color: "#246b55", fontWeight: 700 }}>Company performance & bots</a>
            <a href="/dashboard" style={{ color: "#246b55" }}>PropertyOS workspace</a>
            <a href="/" style={{ color: "#246b55" }}>Public website</a>
          </div>
        </header>

        <section style={{ padding: "34px 0 20px" }}>
          <p style={{ color: "#6d9e8b", fontSize: 11, letterSpacing: 2 }}>PRIVATE COMPANY OVERVIEW</p>
          <h2 style={{ fontSize: 38, letterSpacing: -1.5, margin: "8px 0" }}>Good day{email ? `, ${email}` : ""}.</h2>
          <p style={{ color: "#687573", lineHeight: 1.7, maxWidth: 760 }}>A read-only overview of the PropertyOS AI business systems. Counts are limited to the workspace your signed-in account can access. Secrets and customer payment credentials are never displayed here.</p>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(145px,1fr))", gap: 13, margin: "18px 0 28px" }}>
          {metrics.map(([label, value]) => (
            <article key={label} style={card}>
              <p style={{ color: "#687573", fontSize: 12, margin: 0 }}>{label}</p>
              <p style={{ fontSize: 30, fontWeight: 800, margin: "12px 0 0" }}>{value === null ? "—" : value.toLocaleString("en-KE")}</p>
              {value === null && <small style={{ color: "#8a5a27" }}>Not available</small>}
            </article>
          ))}
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(290px,1fr))", gap: 18 }}>
          <article style={card}>
            <h2 style={{ marginTop: 0 }}>Company & product</h2>
            <p><b>Parent enterprise</b><br />Stariuxe Enterprises</p>
            <p><b>Product</b><br />PropertyOS AI — property and rent management for landlords.</p>
            <p><b>Operating model</b><br />Subscription software, with M-Pesa integration currently restricted to sandbox testing.</p>
            <p><b>Workspace</b><br />{organization?.name ?? "No connected workspace"}{membership?.role ? ` · ${membership.role}` : ""}</p>
          </article>

          <article style={card}>
            <h2 style={{ marginTop: 0 }}>System health</h2>
            <p style={{ color: "#687573", fontSize: 12 }}>A basic availability/configuration check, not a full security audit.</p>
            <div style={{ display: "grid", gap: 13 }}>
              {systems.map(([label, status, good]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 12, borderBottom: "1px solid #edf0eb", paddingBottom: 10 }}>
                  <span>{label}</span>
                  <span style={{ color: good ? "#28734e" : "#9a5a22", fontWeight: 700, textAlign: "right", fontSize: 13 }}>{status}</span>
                </div>
              ))}
            </div>
          </article>

          <article style={card}>
            <h2 style={{ marginTop: 0 }}>Operations desk</h2>
            <p style={{ color: "#687573", lineHeight: 1.65 }}>Open the relevant workspace to inspect operational records. The owner centre does not initiate payments, send messages, or change customer data.</p>
            <div style={{ display: "grid", gap: 10 }}>
              <a href="/dashboard/operations" style={{ color: "#246b55", fontWeight: 700 }}>Property, tenant & rent operations →</a>
              <a href="https://github.com/Stariuxe/create-an-app-that-monitors-rent-of-properties" target="_blank" rel="noreferrer" style={{ color: "#246b55", fontWeight: 700 }}>Source code & engineering work →</a>
              <a href="https://vercel.com/dashboard" target="_blank" rel="noreferrer" style={{ color: "#246b55", fontWeight: 700 }}>Deployment control →</a>
              <a href="https://supabase.com/dashboard/project/yxqhujnhsxbxjfvzoskv" target="_blank" rel="noreferrer" style={{ color: "#246b55", fontWeight: 700 }}>Database & authentication →</a>
            </div>
          </article>

          <article style={card}>
            <h2 style={{ marginTop: 0 }}>Operating bots & monitoring</h2>
            <p style={{ color: "#687573", lineHeight: 1.65 }}>The daily PropertyOS Launch Monitor is active and checks the public site, repository, deployment and connected Supabase project. It reports findings; it does not independently repair systems or perform business transactions.</p>
            <p style={{ fontSize: 13, lineHeight: 1.6 }}>Customer support, sales, finance and technical-assistant workflows are planned separately and must be connected to verified data sources before being treated as operational.</p>
          </article>
        </section>

        <footer style={{ color: "#7a8580", fontSize: 12, padding: "28px 0" }}>Private owner view · Read-only · Last page load: {new Date().toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })} (Nairobi time)</footer>
      </div>
    </main>
  );
}
