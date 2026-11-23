import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const card: React.CSSProperties = {
  background: "rgba(255,255,255,.78)",
  backdropFilter: "blur(18px)",
  border: "1px solid rgba(255,255,255,.88)",
  borderRadius: 16,
  padding: 20,
  boxShadow: "0 12px 32px rgba(19,44,42,.07)",
};

export default async function PaymentReconciliationPage() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const uid = claims?.claims?.sub;
  if (!uid) redirect("/login?next=%2Fdashboard%2Fpayments%2Freconciliation");

  const { data: members } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", uid)
    .in("role", ["landlord", "property_manager", "accountant"]);

  const organizationIds = [...new Set((members ?? []).map((member) => member.organization_id))];
  if (!organizationIds.length) {
    return (
      <main style={{ maxWidth: 1000, margin: "24px auto", padding: 24, color: "#183b32" }}>
        <h1>Payment reconciliation</h1>
        <p>This area is available to authorised workspace staff only.</p>
        <a href="/dashboard/operations">Return to workspace</a>
      </main>
    );
  }

  const { data: credits, error } = await supabase
    .from("tenant_payment_credits")
    .select("id, organization_id, tenant_id, amount, currency, status, notes, created_at, tenant:tenants!tenant_payment_credits_tenant_org_fk(full_name), payment:payments!tenant_payment_credits_source_payment_id_fkey(provider_reference, paid_at)")
    .in("organization_id", organizationIds)
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = credits ?? [];
  const availableTotal = rows
    .filter((credit) => credit.status === "available")
    .reduce((sum, credit) => sum + Number(credit.amount), 0);

  return (
    <main style={{ maxWidth: 1120, margin: "24px auto", padding: "8px 20px 36px", color: "#183b32" }}>
      <a href="/dashboard/operations" style={{ color: "#315e4d", fontWeight: 700 }}>← Back to workspace</a>
      <p style={{ fontSize: 11, letterSpacing: 2, color: "#6d9e8b", marginTop: 24 }}>PROPERTYOS AI · FINANCE</p>
      <h1 style={{ fontSize: 34, margin: "8px 0" }}>Payment reconciliation</h1>
      <p style={{ color: "#687573", lineHeight: 1.6, maxWidth: 760 }}>
        Review confirmed M-Pesa receipts that could not all be allocated to a rent charge. These amounts are preserved as tenant credits and are not counted as additional rent collected.
      </p>
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14, margin: "22px 0" }}>
        <article style={card}>
          <p style={{ margin: 0, color: "#718078", fontSize: 12 }}>Available tenant credits</p>
          <strong style={{ display: "block", fontSize: 28, marginTop: 8 }}>KES {availableTotal.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
          <small style={{ color: "#718078" }}>{rows.filter((credit) => credit.status === "available").length} item(s) awaiting review</small>
        </article>
        <article style={card}>
          <p style={{ margin: 0, color: "#718078", fontSize: 12 }}>All reconciliation records</p>
          <strong style={{ display: "block", fontSize: 28, marginTop: 8 }}>{rows.length}</strong>
          <small style={{ color: "#718078" }}>Latest 200 records</small>
        </article>
      </section>
      <section style={card}>
        <h2 style={{ marginTop: 0 }}>Credit ledger</h2>
        {error ? (
          <p role="alert" style={{ color: "#9a382d" }}>The credit ledger could not be loaded. Please refresh or contact support.</p>
        ) : rows.length ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 680, fontSize: 13 }}>
              <thead><tr style={{ textAlign: "left", color: "#718078" }}>
                <th style={{ padding: "10px 8px" }}>Tenant</th>
                <th style={{ padding: "10px 8px" }}>Receipt</th>
                <th style={{ padding: "10px 8px" }}>Credit</th>
                <th style={{ padding: "10px 8px" }}>Status</th>
                <th style={{ padding: "10px 8px" }}>Recorded</th>
              </tr></thead>
              <tbody>
                {rows.map((credit) => {
                  const tenant = Array.isArray(credit.tenant) ? credit.tenant[0] : credit.tenant;
                  const payment = Array.isArray(credit.payment) ? credit.payment[0] : credit.payment;
                  return <tr key={credit.id} style={{ borderTop: "1px solid #e5ece6" }}>
                    <td style={{ padding: "12px 8px" }}>{tenant?.full_name ?? "Tenant record"}</td>
                    <td style={{ padding: "12px 8px" }}>{payment?.provider_reference ?? "Receipt pending"}</td>
                    <td style={{ padding: "12px 8px", fontWeight: 750 }}>KES {Number(credit.amount).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style={{ padding: "12px 8px" }}>{credit.status.replace("_", " ")}</td>
                    <td style={{ padding: "12px 8px" }}>{new Date(credit.created_at).toLocaleString("en-KE")}</td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: "#718078" }}>No tenant credits need reconciliation. New records will appear here if a confirmed receipt exceeds the outstanding rent balance.</p>
        )}
        <p style={{ marginBottom: 0, color: "#718078", fontSize: 11, lineHeight: 1.6 }}>
          This page is read-only. Apply or refund credits only after verifying the bank/M-Pesa settlement and recording the corresponding accounting action.
        </p>
      </section>
    </main>
  );
}
