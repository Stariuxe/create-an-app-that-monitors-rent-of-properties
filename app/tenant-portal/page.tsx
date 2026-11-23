import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/dashboard/actions";

type TenantRow = { id: string; organization_id: string; full_name: string };
type LeaseRow = {
  id: string; tenant_id: string; organization_id: string; unit_id: string;
  monthly_rent: number; start_date: string; end_date: string | null;
  rent_due_day: number; status: string;
};
type ChargeRow = {
  id: string; lease_id: string; billing_period: string; due_date: string;
  amount: number; amount_paid: number; status: string;
};
type PaymentRow = {
  id: string; amount: number; method: string; status: string;
  paid_at: string | null; created_at: string;
};
type MaintenanceRow = {
  id: string; title: string; description: string | null; priority: string;
  status: string; reported_at: string; payment_status: string | null;
};

const money = (value: number) => "KES " + Number(value || 0).toLocaleString("en-KE");
const date = (value: string | null | undefined) => value
  ? new Date(value + (value.length === 10 ? "T00:00:00" : "")).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })
  : "—";

export default async function TenantPortalPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { notice } = await searchParams;
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) redirect("/login?next=%2Ftenant-portal");

  // Every lookup is scoped to the signed-in user and remains subject to table RLS.
  const { data: tenantRows, error: tenantError } = await supabase
    .from("tenants")
    .select("id,organization_id,full_name")
    .eq("auth_user_id", userId);
  const tenants = (tenantRows ?? []) as TenantRow[];
  const tenantIds = tenants.map((tenant) => tenant.id);

  let leases: LeaseRow[] = [];
  let charges: ChargeRow[] = [];
  let payments: PaymentRow[] = [];
  let maintenance: MaintenanceRow[] = [];
  let units: Array<{ id: string; property_id: string; unit_number: string }> = [];
  let properties: Array<{ id: string; name: string; address: string | null; county: string | null }> = [];
  let dataError = Boolean(tenantError);

  if (tenantIds.length) {
    const [leaseResult, paymentResult, maintenanceResult] = await Promise.all([
      supabase.from("leases")
        .select("id,tenant_id,organization_id,unit_id,monthly_rent,start_date,end_date,rent_due_day,status")
        .in("tenant_id", tenantIds),
      supabase.from("payments")
        .select("id,amount,method,status,paid_at,created_at")
        .in("tenant_id", tenantIds)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase.from("maintenance_requests")
        .select("id,title,description,priority,status,reported_at,payment_status")
        .in("tenant_id", tenantIds)
        .order("reported_at", { ascending: false })
        .limit(20),
    ]);
    dataError ||= Boolean(leaseResult.error || paymentResult.error || maintenanceResult.error);
    leases = (leaseResult.data ?? []) as LeaseRow[];
    payments = (paymentResult.data ?? []) as PaymentRow[];
    maintenance = (maintenanceResult.data ?? []) as MaintenanceRow[];

    const leaseIds = leases.map((lease) => lease.id);
    const unitIds = Array.from(new Set(leases.map((lease) => lease.unit_id)));
    if (leaseIds.length) {
      const chargeResult = await supabase.from("rent_charges")
        .select("id,lease_id,billing_period,due_date,amount,amount_paid,status")
        .in("lease_id", leaseIds)
        .order("due_date", { ascending: false })
        .limit(30);
      dataError ||= Boolean(chargeResult.error);
      charges = (chargeResult.data ?? []) as ChargeRow[];
    }
    if (unitIds.length) {
      const unitResult = await supabase.from("units")
        .select("id,property_id,unit_number")
        .in("id", unitIds);
      dataError ||= Boolean(unitResult.error);
      units = unitResult.data ?? [];
      const propertyIds = Array.from(new Set(units.map((unit) => unit.property_id)));
      if (propertyIds.length) {
        const propertyResult = await supabase.from("properties")
          .select("id,name,address,county")
          .in("id", propertyIds);
        dataError ||= Boolean(propertyResult.error);
        properties = propertyResult.data ?? [];
      }
    }
  }

  const outstanding = charges.reduce((sum, charge) =>
    sum + Math.max(0, Number(charge.amount) - Number(charge.amount_paid || 0)), 0);
  const latestLease = leases.find((lease) => lease.status === "active") ?? leases[0];
  const unit = units.find((item) => item.id === latestLease?.unit_id);
  const property = properties.find((item) => item.id === unit?.property_id);
  const chargeBalance = (charge: ChargeRow) => Math.max(0, Number(charge.amount) - Number(charge.amount_paid || 0));

  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(135deg,#f3f5ef,#e9eee8 55%,#f4f3ed)", color: "#132c2a", padding: "28px 5%" }}>
      <header style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, padding: "14px 18px", background: "rgba(255,255,255,.8)", border: "1px solid #dce4dc", borderRadius: 14 }}>
        <a href="/" style={{ color: "#183b32", fontWeight: 800, textDecoration: "none", fontSize: 20 }}>PropertyOS <span style={{ color: "#639b86" }}>AI</span></a>
        <form action={signOut}><button type="submit" style={{ border: "1px solid #bdcbc0", borderRadius: 6, padding: "9px 14px", background: "transparent", color: "#183b32" }}>Sign out</button></form>
      </header>
      <section style={{ maxWidth: 1100, margin: "38px auto" }}>
        <p style={{ color: "#6d9e8b", fontSize: 11, letterSpacing: 2 }}>TENANT PORTAL</p>
        <h1 style={{ fontSize: 36, letterSpacing: -1.5, margin: "10px 0" }}>Welcome{tenants[0]?.full_name ? ", " + tenants[0].full_name : ""}.</h1>
        <p style={{ color: "#687573", lineHeight: 1.7 }}>View your tenancy, rent balance, payments and maintenance updates in one secure place.</p>
        {notice === "awaiting_invitation" && !tenants.length && <div role="status" style={{ margin: "18px 0", padding: 16, background: "#fff5df", border: "1px solid #ead6a8", borderRadius: 10 }}>Your account is registered. Ask your landlord or property manager to send an authorised invitation linking your tenancy to this email address. No property information is available until that link is completed.</div>}
        {dataError && <div role="alert" style={{ margin: "18px 0", padding: 14, background: "#fff0df", border: "1px solid #e8c99d", borderRadius: 10 }}>Some tenant information could not be loaded. Your records have not been changed. Please refresh or contact your property administrator if this continues.</div>}
        {!tenants.length && !dataError && notice !== "awaiting_invitation" && <div style={{ marginTop: 20, padding: 22, background: "#fff", border: "1px solid #dce4dc", borderRadius: 12 }}>Your account is not yet linked to a tenant record. Ask your landlord to invite you using this email address.</div>}
        {tenants.length > 0 && <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 14, margin: "24px 0" }}>
            <article style={{ padding: 20, background: "#fff", border: "1px solid #dce4dc", borderRadius: 12 }}><small>Rent outstanding</small><div style={{ fontSize: 24, fontWeight: 800, marginTop: 8 }}>{money(outstanding)}</div></article>
            <article style={{ padding: 20, background: "#fff", border: "1px solid #dce4dc", borderRadius: 12 }}><small>Monthly rent</small><div style={{ fontSize: 24, fontWeight: 800, marginTop: 8 }}>{latestLease ? money(latestLease.monthly_rent) : "—"}</div></article>
            <article style={{ padding: 20, background: "#fff", border: "1px solid #dce4dc", borderRadius: 12 }}><small>Rent due day</small><div style={{ fontSize: 24, fontWeight: 800, marginTop: 8 }}>{latestLease ? latestLease.rent_due_day : "—"}</div></article>
            <article style={{ padding: 20, background: "#fff", border: "1px solid #dce4dc", borderRadius: 12 }}><small>Active leases</small><div style={{ fontSize: 24, fontWeight: 800, marginTop: 8 }}>{leases.filter((lease) => lease.status === "active").length}</div></article>
          </div>
          <article style={{ padding: 22, background: "#fff", border: "1px solid #dce4dc", borderRadius: 12, marginBottom: 16 }}>
            <h2 style={{ marginTop: 0 }}>My property</h2>
            {latestLease ? <p style={{ lineHeight: 1.8, color: "#53665c" }}><b>{property?.name ?? "Property"}</b> · Unit {unit?.unit_number ?? "—"}<br />{property?.address || property?.county || "Address not available"}<br />Lease: {date(latestLease.start_date)} – {date(latestLease.end_date)}<br />Status: {latestLease.status.replaceAll("_", " ")}</p> : <p>No lease is linked to your tenant account yet.</p>}
          </article>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(290px,1fr))", gap: 16 }}>
            <article style={{ padding: 22, background: "#fff", border: "1px solid #dce4dc", borderRadius: 12 }}>
              <h2 style={{ marginTop: 0 }}>Rent charges</h2>
              {charges.length ? charges.map((charge) => <p key={charge.id} style={{ borderBottom: "1px solid #edf0eb", paddingBottom: 10, lineHeight: 1.6 }}><b>{date(charge.billing_period)}</b><br />Due {date(charge.due_date)} · {money(charge.amount)}<br /><small>Balance: {money(chargeBalance(charge))} · {charge.status}</small></p>) : <p>No rent charges have been issued yet.</p>}
            </article>
            <article style={{ padding: 22, background: "#fff", border: "1px solid #dce4dc", borderRadius: 12 }}>
              <h2 style={{ marginTop: 0 }}>Payment history</h2>
              {payments.length ? payments.map((payment) => <p key={payment.id} style={{ borderBottom: "1px solid #edf0eb", paddingBottom: 10, lineHeight: 1.6 }}><b>{money(payment.amount)}</b><br />{payment.method} · {payment.status}<br /><small>{date(payment.paid_at || payment.created_at)}</small></p>) : <p>No payments recorded yet.</p>}
            </article>
            <article style={{ padding: 22, background: "#fff", border: "1px solid #dce4dc", borderRadius: 12 }}>
              <h2 style={{ marginTop: 0 }}>Maintenance updates</h2>
              {maintenance.length ? maintenance.map((item) => <p key={item.id} style={{ borderBottom: "1px solid #edf0eb", paddingBottom: 10, lineHeight: 1.6 }}><b>{item.title}</b><br />{item.description || "No additional details"}<br /><small>{item.priority} priority · {item.status.replaceAll("_", " ")} · {date(item.reported_at)} · {item.payment_status || "payment status unavailable"}</small></p>) : <p>No maintenance requests are linked to your account.</p>}
            </article>
          </div>
        </>}
      </section>
    </main>
  );
}
