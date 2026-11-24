import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const ownerEmails = (process.env.PROPERTYOS_OWNER_EMAILS ?? "").split(",").map((x) => x.trim().toLowerCase()).filter(Boolean);
const card: React.CSSProperties = { background: "#fff", border: "1px solid #dce4dc", borderRadius: 14, padding: 22, boxShadow: "0 8px 28px rgba(19,44,42,.04)" };
const money = (n: number) => "KES " + Math.round(n).toLocaleString("en-KE");
const agents = [
  { name: "PropertyOS Launch Monitor", status: "ACTIVE · DAILY", task: "Checks public website, safe routes, GitHub CI/PRs, Vercel deployment, Supabase health and configuration presence.", issue: "Launch readiness can be blocked by failed builds, unavailable routes, security warnings or missing configuration.", fix: "Produces evidence-backed PASS / WARNING / FAIL / NOT VERIFIED reports and the next action. It is read-only; it does not silently change production.", prevention: "Keep daily checks enabled; require exact-SHA build and route verification before releases." },
  { name: "Technical Operations Bot", status: "PLANNED", task: "Review errors, failed builds, slow pages, workspace creation and broken landlord workflows.", issue: "Previously reported: lag, workspace creation failures, empty rent-charge selection and blank screens after form submission.", fix: "Earlier engineering changes added workspace diagnostics, atomic lease creation and validation. Full authenticated end-to-end verification is still outstanding.", prevention: "Automated smoke tests for signup, workspace, property, unit, tenant, lease, rent charge and payment callback before every release." },
  { name: "Security Sentinel Bot", status: "PLANNED", task: "Review Supabase RLS, authentication, exposed routes, dependency alerts, secrets presence and tenant isolation.", issue: "Known review findings include leaked-password protection disabled and overlapping permissive policies on some tables.", fix: "No blanket policy changes have been applied; the safe response is to test role isolation and resolve each policy deliberately.", prevention: "Scheduled security review, least-privilege policies, owner-only access checks and no secret values in logs or dashboards." },
  { name: "Customer Success Bot", status: "PLANNED", task: "Guide landlords through onboarding, properties, units, tenants, leases, rent charges and support requests.", issue: "New landlords may not understand the required setup sequence and can get stuck when no rent charges exist.", fix: "The operations page now explains the property → unit → tenant → lease → rent charge sequence when no charge is available.", prevention: "Contextual help, searchable help articles, onboarding checklist and human escalation for unresolved cases." },
  { name: "Sales & Growth Bot", status: "PLANNED", task: "Track enquiries, qualify landlord leads, follow up with consent, monitor conversion and recommend campaigns.", issue: "The production homepage previously used a pilot enquiry form that did not save submissions; secure lead capture is under review in PR #4.", fix: "A secure, consent-based lead capture implementation has been proposed; it must pass preview and live tests before use.", prevention: "Test every lead form end-to-end, track funnel conversion and require approval before customer messaging or ad spend." },
  { name: "Finance & Revenue Bot", status: "PLANNED", task: "Reconcile company subscription income, refunds, payment fees, operating costs, MRR, churn and cash runway.", issue: "The current rent/payment ledger records property rent activity, not necessarily subscription income owed to Stariuxe.", fix: "This dashboard separates rent collection from company revenue and shows subscription projections as scenarios only.", prevention: "Create a dedicated subscription billing ledger and reconcile provider settlements against invoices and bank receipts monthly." },
];
const incidents = [
  { title: "Landlord workspace access / creation", status: "CODE CHANGE MADE · VERIFY", problem: "Users reported being denied access or not receiving a workspace.", solution: "Signup and workspace authorization fixes were merged earlier; diagnostics and membership-aware access checks were added.", prevention: "Automated tests for first signup, workspace creation, role membership and sign-in refresh." },
  { title: "Lease and unit consistency", status: "CODE CHANGE MADE", problem: "Concurrent lease creation could risk duplicate unit occupancy or inconsistent unit state.", solution: "An atomic lease-creation RPC now validates membership, locks the unit, creates the lease and marks the unit occupied in one transaction.", prevention: "Keep the transaction and add concurrent-request regression tests." },
  { title: "Rent charge / M-Pesa test readiness", status: "PARTIAL · SANDBOX ONLY", problem: "The M-Pesa selector is empty when there are no unpaid rent charges; payment callback reconciliation is not yet proven end-to-end.", solution: "The interface now explains the setup sequence; duplicate pending M-Pesa prompts are guarded.", prevention: "Create a test lease and charge, then test STK prompt, callback, amount match, duplicate callback and reconciliation in sandbox." },
  { title: "Secure pilot enquiry capture", status: "PENDING PREVIEW VERIFICATION", problem: "The old public pilot form did not persist enquiries.", solution: "Secure server-side lead capture with consent, same-origin checks, honeypot and Turnstile verification is proposed in PR #4.", prevention: "Do not merge until exact-SHA preview, Turnstile and database insertion tests pass." },
  { title: "Database security posture", status: "OPEN REVIEW ITEMS", problem: "Previously identified Supabase warnings include leaked-password protection disabled and overlapping permissive policies.", solution: "No unsafe blanket changes; policy-by-policy review is required.", prevention: "Enable leaked-password protection in Auth settings and test landlord/tenant isolation before changing policies." },
];

export default async function OwnerBusinessPerformancePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const userId = claims?.sub;
  const email = String(claims?.email ?? "").trim().toLowerCase();
  if (!userId) redirect("/login?next=%2Fowner%2Fbusiness");
  if (!email || !ownerEmails.includes(email)) redirect("/owner");

  const { data: memberships } = await supabase.from("organization_members").select("organization_id,role,organizations(name)").eq("user_id", userId);
  const member = memberships?.find((x: any) => ["landlord", "property_manager", "accountant", "platform_admin"].includes(x.role)) ?? memberships?.[0];
  const orgId = member?.organization_id;
  const [leaseResult, chargeResult, paymentResult] = await Promise.all([
    orgId ? supabase.from("leases").select("id,monthly_rent,status").eq("organization_id", orgId).eq("status", "active").limit(2000) : Promise.resolve({ data: null, error: null }),
    orgId ? supabase.from("rent_charges").select("id,amount,amount_paid,status,billing_period,due_date").eq("organization_id", orgId).limit(2000) : Promise.resolve({ data: null, error: null }),
    orgId ? supabase.from("payments").select("id,amount,currency,method,status,created_at").eq("organization_id", orgId).order("created_at", { ascending: false }).limit(2000) : Promise.resolve({ data: null, error: null }),
  ]);
  const leases = leaseResult.data ?? [];
  const charges = chargeResult.data ?? [];
  const payments = paymentResult.data ?? [];
  const activeLeaseRent = leases.reduce((s: number, x: any) => s + Number(x.monthly_rent || 0), 0);
  const totalCharged = charges.reduce((s: number, x: any) => s + Number(x.amount || 0), 0);
  const rentPaidAgainstCharges = charges.reduce((s: number, x: any) => s + Number(x.amount_paid || 0), 0);
  const outstanding = Math.max(0, totalCharged - rentPaidAgainstCharges);
  const confirmedStatuses = new Set(["completed", "succeeded", "success", "paid", "confirmed"]);
  const confirmedPaymentRows = payments.filter((x: any) => confirmedStatuses.has(String(x.status).toLowerCase()));
  const confirmedPaymentValue = confirmedPaymentRows.reduce((s: number, x: any) => s + Number(x.amount || 0), 0);
  const paymentErrors = Boolean(leaseResult.error || chargeResult.error || paymentResult.error);
  const plans = [{ name: "Starter", price: 500 }, { name: "Growth", price: 1000 }, { name: "Professional", price: 2500 }];
  const scenarios = [10, 25, 50, 100].map((customers) => ({ customers, low: customers * 500, mid: customers * 1000, high: customers * 2500 }));
  const org = member?.organizations;
  const orgName = Array.isArray(org) ? org[0]?.name : org;

  return <main style={{ minHeight: "100vh", background: "#f3f2ec", color: "#132c2a", padding: "28px 5%" }}>
    <div style={{ maxWidth: 1240, margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", borderBottom: "1px solid #d8dfd6", paddingBottom: 18 }}>
        <div><p style={{ color: "#6d9e8b", fontSize: 10, letterSpacing: 2, margin: 0 }}>STARIUXE ENTERPRISES · PRIVATE</p><h1 style={{ fontSize: 28, margin: "6px 0" }}>Company Performance & Intelligence</h1><p style={{ color: "#687573", margin: 0 }}>Financial position, operating agents, incidents and improvement priorities.</p></div>
        <nav style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}><a href="/owner" style={{ color: "#246b55" }}>Owner Control Centre</a><a href="/dashboard/operations" style={{ color: "#246b55" }}>Property operations</a></nav>
      </header>

      <section style={{ padding: "28px 0 14px" }}>
        <h2 style={{ fontSize: 23 }}>1. Financial performance</h2>
        <div style={{ border: "1px solid #e6c99a", background: "#fff8ec", borderRadius: 10, padding: 16, lineHeight: 1.65 }}>
          <b>Accounting distinction:</b> figures below from rent charges and payment records belong to the landlord/property workflow. They are not automatically Stariuxe's SaaS revenue. Company subscription revenue is <b>not yet verifiable</b> because a dedicated subscription invoice and settlement ledger has not been connected.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 13, marginTop: 16 }}>
          {[
            ["Verified company subscription revenue", "Not connected", "No subscription ledger / settlement source verified."],
            ["Confirmed payment records in workspace", money(confirmedPaymentValue), confirmedPaymentRows.length + " records with recognised success statuses; not classified as company revenue."],
            ["Monthly rent under active leases", money(activeLeaseRent), "Landlord portfolio rent value; not company income."],
            ["Outstanding rent charges", money(outstanding), "Based on rent charges less amounts marked paid."],
          ].map(([label, value, note]) => <article key={label} style={card}><small style={{ color: "#687573" }}>{label}</small><div style={{ fontSize: 25, fontWeight: 800, margin: "12px 0 8px" }}>{value}</div><p style={{ color: "#687573", fontSize: 12, lineHeight: 1.5, margin: 0 }}>{note}</p></article>)}
        </div>
        {paymentErrors && <p role="status" style={{ color: "#8a5a22" }}>Some financial records could not be loaded. Treat displayed figures as incomplete until the database access issue is resolved.</p>}
        <article style={{ ...card, marginTop: 16 }}>
          <h3 style={{ marginTop: 0 }}>Illustrative subscription revenue targets (KES / month)</h3>
          <p style={{ color: "#687573", fontSize: 13, lineHeight: 1.6 }}>Planning scenarios only, using unapproved example prices: Starter KES 500, Growth KES 1,000, Professional KES 2,500 per paying landlord per month. These are not live prices, sales, forecasts or commitments.</p>
          <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}><thead><tr>{["Paying landlords","Starter scenario","Growth scenario","Professional scenario"].map(x => <th key={x} style={{ padding: 10, borderBottom: "1px solid #dce4dc" }}>{x}</th>)}</tr></thead><tbody>{scenarios.map(x => <tr key={x.customers}><td style={{ padding: 10, borderBottom: "1px solid #edf0eb" }}>{x.customers}</td><td style={{ padding: 10, borderBottom: "1px solid #edf0eb" }}>{money(x.low)}</td><td style={{ padding: 10, borderBottom: "1px solid #edf0eb" }}>{money(x.mid)}</td><td style={{ padding: 10, borderBottom: "1px solid #edf0eb" }}>{money(x.high)}</td></tr>)}</tbody></table></div>
          <p style={{ color: "#687573", fontSize: 12, marginBottom: 0 }}>Example: 50 paying landlords at KES 1,000/month would produce KES 50,000 gross monthly recurring revenue before payment fees, taxes, refunds and operating costs.</p>
        </article>
        <article style={{ ...card, marginTop: 16 }}>
          <h3 style={{ marginTop: 0 }}>What is needed to show actual company profit</h3>
          <ol style={{ lineHeight: 1.8, paddingLeft: 20 }}><li>Choose and approve subscription prices and billing frequency.</li><li>Connect a subscription/invoice ledger to successful provider settlements.</li><li>Record refunds, chargebacks, payment fees and tax obligations.</li><li>Record operating costs (hosting, email/SMS, AI, support and marketing).</li><li>Calculate gross revenue, net revenue, monthly recurring revenue, churn and operating profit from reconciled records.</li></ol>
        </article>
      </section>

      <section style={{ padding: "18px 0" }}>
        <h2 style={{ fontSize: 23 }}>2. Operating bots — names, tasks and status</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 14 }}>
          {agents.map((a) => <article key={a.name} style={card}><div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}><h3 style={{ margin: 0 }}>{a.name}</h3><span style={{ fontSize: 10, fontWeight: 800, color: a.status.startsWith("ACTIVE") ? "#28734e" : "#8a5a22" }}>{a.status}</span></div><p><b>Task</b><br />{a.task}</p><p><b>Problem it is designed to identify</b><br />{a.issue}</p><p><b>How it solved / responds</b><br />{a.fix}</p><p style={{ marginBottom: 0 }}><b>Prevention</b><br />{a.prevention}</p></article>)}
        </div>
        <p style={{ color: "#687573", fontSize: 12 }}>Only PropertyOS Launch Monitor is confirmed active. Other bots are operating designs, not deployed autonomous agents. The dashboard does not invent completed bot activity.</p>
      </section>

      <section style={{ padding: "18px 0" }}>
        <h2 style={{ fontSize: 23 }}>3. Problem register — fixes and prevention</h2>
        <div style={{ display: "grid", gap: 12 }}>
          {incidents.map((x) => <article key={x.title} style={card}><div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}><h3 style={{ margin: 0 }}>{x.title}</h3><span style={{ fontSize: 11, fontWeight: 800, color: "#8a5a22" }}>{x.status}</span></div><p><b>Problem identified:</b> {x.problem}</p><p><b>How it was addressed:</b> {x.solution}</p><p style={{ marginBottom: 0 }}><b>How to prevent recurrence:</b> {x.prevention}</p></article>)}
        </div>
      </section>

      <section style={{ padding: "18px 0" }}>
        <h2 style={{ fontSize: 23 }}>4. Improvement priorities</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 13 }}>
          {[
            ["P0 · Prove core landlord journey","Run an authenticated end-to-end test: signup → workspace → property → unit → tenant → lease → rent charge. Do not onboard paying users until this passes."],
            ["P0 · Finish secure lead capture","Verify PR #4 preview from its exact commit, Turnstile server validation and a real test lead insertion before merging."],
            ["P0 · Verify M-Pesa sandbox","Test STK request, callback token, amount matching, duplicate callbacks and reconciliation. Keep live payments disabled."],
            ["P1 · Establish company revenue records","Approve pricing, connect recurring subscriptions and reconcile settlement receipts; separate company fees from landlord rent."],
            ["P1 · Close security warnings","Enable leaked-password protection and test RLS/tenant isolation before modifying permissive policies."],
            ["P1 · Measure product reliability","Add error monitoring, uptime checks, onboarding funnel metrics, page performance and weekly incident review."],
          ].map(([title, body]) => <article key={title} style={card}><h3 style={{ marginTop: 0 }}>{title}</h3><p style={{ color: "#687573", lineHeight: 1.65, marginBottom: 0 }}>{body}</p></article>)}
        </div>
      </section>

      <footer style={{ borderTop: "1px solid #d8dfd6", marginTop: 24, padding: "20px 0", color: "#687573", fontSize: 12 }}>Private owner view · Workspace: {orgName ?? "not connected"} · Financial figures are subject to source availability and reconciliation. No secrets or tenant personal details are displayed.</footer>
    </div>
  </main>;
}
