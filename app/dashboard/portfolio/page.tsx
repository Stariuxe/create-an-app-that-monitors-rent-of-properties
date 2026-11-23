import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addPortfolioRecord, updatePortfolioRecordStatus } from "./actions";

const card: React.CSSProperties = { background: "rgba(255,255,255,.68)", backdropFilter: "blur(18px) saturate(150%)", WebkitBackdropFilter: "blur(18px) saturate(150%)", border: "1px solid rgba(255,255,255,.82)", boxShadow: "0 14px 38px rgba(19,44,42,.08),inset 0 1px 0 rgba(255,255,255,.9)", borderRadius: 16, padding: 20 };
const field: React.CSSProperties = { width: "100%", padding: 11, border: "1px solid #cfd9d0", borderRadius: 7, marginTop: 6, marginBottom: 12, background: "#fff", color: "#132c2a" };
const button: React.CSSProperties = { padding: "11px 15px", border: 0, borderRadius: 7, background: "#183b32", color: "#fff", fontWeight: 700, cursor: "pointer" };
const money = (value: number) => "KES " + Math.round(value).toLocaleString("en-KE");
const labels: Record<string, string> = { expense: "Expense", maintenance: "Maintenance", compliance: "Compliance", mortgage: "Financing", valuation: "Valuation", other_income: "Other income" };

export default async function PortfolioPage({ searchParams }: { searchParams: Promise<{ property?: string; error?: string; success?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/login?next=%2Fdashboard%2Fportfolio");
  const { data: memberships, error: memberError } = await supabase.from("organization_members")
    .select("organization_id,role,organizations(id,name)").eq("user_id", userId)
    .in("role", ["landlord", "property_manager", "accountant"]);
  if (memberError) return <main style={{ padding: 32 }}>We could not verify your workspace access. Please refresh or sign in again.</main>;
  const membership = memberships?.[0];
  const org = membership ? (Array.isArray(membership.organizations) ? membership.organizations[0] : membership.organizations) : null;
  if (!org) return <main style={{ padding: 32, background: "#f3f2ec", minHeight: "100vh" }}><a href="/dashboard">← Dashboard</a><h1>Portfolio Intelligence</h1><p>Create or open a landlord workspace to get started.</p></main>;

  const [{ data: properties, error: propertyError }, { data: units, error: unitError }, { data: leases, error: leaseError },
    { data: charges, error: chargeError }, { data: records, error: recordError }] = await Promise.all([
      supabase.from("properties").select("id,name,address,county").eq("organization_id", org.id).order("name"),
      supabase.from("units").select("id,property_id,status,monthly_rent").eq("organization_id", org.id).limit(2000),
      supabase.from("leases").select("id,unit_id,monthly_rent,status").eq("organization_id", org.id).eq("status", "active").limit(2000),
      supabase.from("rent_charges").select("id,lease_id,amount,amount_paid,status,billing_period").eq("organization_id", org.id).limit(5000),
      supabase.from("property_portfolio_records").select("id,property_id,record_type,title,amount,record_date,due_date,status,notes,created_at").eq("organization_id", org.id).order("record_date", { ascending: false }).limit(2000),
    ]);
  const loadError = propertyError || unitError || leaseError || chargeError || recordError;
  const propertyList = properties ?? [], unitList = units ?? [], leaseList = leases ?? [], chargeList = charges ?? [], recordList = records ?? [];
  const selected = propertyList.find((p: any) => p.id === params.property) ?? propertyList[0] ?? null;
  const propertyRecords = selected ? recordList.filter((r: any) => r.property_id === selected.id) : [];
  const propertyUnits = selected ? unitList.filter((u: any) => u.property_id === selected.id) : [];
  const propertyLeases = selected ? leaseList.filter((l: any) => propertyUnits.some((u: any) => u.id === l.unit_id)) : [];
  const leaseIds = new Set(propertyLeases.map((l: any) => l.id));
  const propertyCharges = chargeList.filter((c: any) => leaseIds.has(c.lease_id));
  const totalUnits = unitList.length, occupied = unitList.filter((u: any) => u.status === "occupied").length;
  const rentExpected = leaseList.reduce((sum: number, l: any) => sum + Number(l.monthly_rent || 0), 0);
  const rentCollected = chargeList.reduce((sum: number, c: any) => sum + Number(c.amount_paid || 0), 0);
  const arrears = chargeList.reduce((sum: number, c: any) => sum + Math.max(0, Number(c.amount || 0) - Number(c.amount_paid || 0)), 0);
  const sumType = (rows: any[], type: string) => rows.filter((r) => r.record_type === type).reduce((s, r) => s + Number(r.amount || 0), 0);
  const portfolioExpenses = sumType(recordList, "expense") + sumType(recordList, "maintenance");
  const portfolioOtherIncome = sumType(recordList, "other_income");
  const propertyExpenses = sumType(propertyRecords, "expense") + sumType(propertyRecords, "maintenance");
  const propertyOtherIncome = sumType(propertyRecords, "other_income");
  const occupancy = totalUnits ? Math.round((occupied / totalUnits) * 100) : 0;
  const propertyOccupancy = propertyUnits.length ? Math.round((propertyUnits.filter((u: any) => u.status === "occupied").length / propertyUnits.length) * 100) : 0;
  const errors: Record<string, string> = { access: "You do not have permission to view that property's records.", validation: "Please check the required fields, amount, date and record category.", save: "The record could not be saved. Please try again." };
  const successes: Record<string, string> = { saved: "Portfolio detail saved.", updated: "Record status updated." };
  const input = (name: string, label: string, type = "text", required = true) => <label style={{ display: "block", fontSize: 12, fontWeight: 650 }}>{label}<input name={name} type={type} required={required} style={field} /></label>;
  const select = (name: string, label: string, options: { value: string; label: string }[]) => <label style={{ display: "block", fontSize: 12, fontWeight: 650 }}>{label}<select name={name} required style={field}>{options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></label>;
  const metric = (label: string, value: string, note: string) => <article style={card}><small style={{ color: "#6b7c73" }}>{label}</small><div style={{ fontSize: 24, fontWeight: 800, margin: "8px 0" }}>{value}</div><small style={{ color: "#7c8982" }}>{note}</small></article>;

  return <main style={{ minHeight: "100vh", background: "radial-gradient(ellipse at 12% 0%,rgba(175,211,192,.35),transparent 34%),radial-gradient(ellipse at 92% 18%,rgba(184,205,196,.34),transparent 30%),linear-gradient(135deg,#f3f5ef,#e9eee8 55%,#f4f3ed)", color: "#132c2a", padding: "24px 5%" }}>
    <header style={{ position: "sticky", top: 0, zIndex: 20, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap", background: "rgba(247,249,245,.72)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", borderBottom: "1px solid rgba(255,255,255,.8)", padding: "14px 16px", borderRadius: 14, boxShadow: "0 8px 28px rgba(19,44,42,.06)" }}>
      <a href="/dashboard/operations" aria-label="Back to PropertyOS AI workspace" style={{ display: "inline-flex", alignItems: "center", gap: 9, fontWeight: 800, fontSize: 18, color: "#183b32", textDecoration: "none" }}><span aria-hidden="true" style={{ fontSize: 22 }}>←</span> Back to Workspace</a>
      <nav aria-label="Workspace navigation" style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 14, alignItems: "center" }}><a href="/dashboard/operations" style={{ color: "#183b32", fontWeight: 700 }}>Property operations</a><a href="/dashboard/portfolio" aria-current="page" style={{ color: "#183b32", fontWeight: 700 }}>Portfolio Intelligence</a><a href="/dashboard" style={{ color: "#52665c" }}>Account overview</a></nav>
    </header>
    <section style={{ maxWidth: 1240, margin: "30px auto" }}>
      <p style={{ color: "#6d9e8b", fontSize: 11, letterSpacing: 2 }}>PORTFOLIO INTELLIGENCE · {org.name}</p>
      <h1 style={{ fontSize: 36, margin: "8px 0" }}>Know how every property is performing.</h1>
      <p style={{ color: "#687573", lineHeight: 1.6 }}>A live financial and operational overview built from your saved property, lease, rent and portfolio records.</p>
      {params.error && <p role="alert" style={{ padding: 12, borderRadius: 8, background: "#f9e8e2", color: "#8a3829" }}>{errors[params.error] ?? "Something went wrong."}</p>}
      {params.success && <p role="status" style={{ padding: 12, borderRadius: 8, background: "#e5f1e9", color: "#245a3e" }}>{successes[params.success] ?? "Saved."}</p>}
      {loadError && <p role="alert" style={{ padding: 12, background: "#fff0df", color: "#75420d", borderRadius: 8 }}>Some figures could not be loaded. Check the data connection before relying on these totals.</p>}
      <h2 style={{ fontSize: 19, marginTop: 28 }}>Your whole portfolio</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(185px,1fr))", gap: 12 }}>
        {metric("Properties", String(propertyList.length), "Properties in this workspace")}
        {metric("Occupancy", totalUnits ? occupancy + "%" : "—", totalUnits ? occupied + " of " + totalUnits + " units occupied" : "Add units to calculate")}
        {metric("Expected monthly rent", money(rentExpected), "Active lease values")}
        {metric("Rent collected", money(rentCollected), "Sum of recorded rent-charge payments")}
        {metric("Outstanding rent", money(arrears), "Unpaid balances across recorded charges")}
        {metric("Expenses & maintenance", money(portfolioExpenses), "Saved portfolio expense records")}
        {metric("Other income", money(portfolioOtherIncome), "Excludes rent charges and payments")}
        {metric("Net recorded income", money(rentCollected + portfolioOtherIncome - portfolioExpenses), "Collected rent + other income − recorded expenses")}
      </div>
      <p style={{ color: "#78847d", fontSize: 12, lineHeight: 1.6, marginTop: 10 }}>Figures are based on records currently stored in PropertyOS AI. Rent collected and arrears aggregate rent charges; expenses and other income use your saved portfolio entries. No currency conversion or forecast is applied.</p>

      <section style={{ ...card, marginTop: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div><h2 style={{ margin: 0 }}>Property performance</h2><p style={{ margin: "6px 0 0", color: "#687573", fontSize: 13 }}>Select a property to see its own results and records.</p></div>
          <form method="get"><select name="property" aria-label="Select property" defaultValue={selected?.id ?? ""} style={{ ...field, minWidth: 240, margin: 0 }}>{propertyList.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}</select><button style={{ ...button, marginLeft: 8 }}>View property</button></form>
        </div>
        {!selected ? <p style={{ marginTop: 20 }}>No properties have been added yet. Add your first property in <a href="/dashboard/operations">Property operations</a>.</p> : <>
          <h3 style={{ margin: "22px 0 4px" }}>{selected.name}</h3><p style={{ color: "#687573", marginTop: 0 }}>{selected.address || selected.county || "Address not added"}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(165px,1fr))", gap: 10 }}>
            {metric("Occupancy", propertyUnits.length ? propertyOccupancy + "%" : "—", propertyUnits.length + " units")}
            {metric("Expected monthly rent", money(propertyLeases.reduce((s: number, l: any) => s + Number(l.monthly_rent || 0), 0)), "Active leases")}
            {metric("Rent charged", money(propertyCharges.reduce((s: number, c: any) => s + Number(c.amount || 0), 0)), "Recorded charges")}
            {metric("Rent collected", money(propertyCharges.reduce((s: number, c: any) => s + Number(c.amount_paid || 0), 0)), "Recorded paid amounts")}
            {metric("Arrears", money(propertyCharges.reduce((s: number, c: any) => s + Math.max(0, Number(c.amount || 0) - Number(c.amount_paid || 0)), 0)), "Outstanding charge balances")}
            {metric("Expenses", money(propertyExpenses), "Expense + maintenance entries")}
            {metric("Other income", money(propertyOtherIncome), "Other income entries")}
            {metric("Net recorded income", money(propertyCharges.reduce((s: number, c: any) => s + Number(c.amount_paid || 0), 0) + propertyOtherIncome - propertyExpenses), "Collected rent + other income − expenses")}
          </div>
          <h3 style={{ marginTop: 26 }}>Add details for {selected.name}</h3>
          <form action={addPortfolioRecord} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 12, alignItems: "end" }}>
            <input type="hidden" name="property_id" value={selected.id} />
            {select("record_type", "Detail type", Object.entries(labels).map(([value, label]) => ({ value, label })))}
            {input("title", "Title / description")}
            {input("amount", "Amount / value (KES)", "number", false)}
            {input("record_date", "Date", "date")}
            {input("due_date", "Due / expiry date", "date", false)}
            {select("status", "Status", ["recorded", "planned", "in_progress", "completed", "paid", "overdue"].map((value) => ({ value, label: value.replace("_", " ") })))}
            <label style={{ display: "block", fontSize: 12, fontWeight: 650 }}>Notes<textarea name="notes" maxLength={2000} rows={2} style={{ ...field, resize: "vertical" }} /></label>
            <button type="submit" style={button}>Save property detail</button>
          </form>
          <p style={{ color: "#78847d", fontSize: 12, lineHeight: 1.6 }}>Use expenses for repairs, utilities, insurance and taxes; maintenance for work orders and costs; compliance for certificates and expiry dates; financing for lender and balance notes; valuation for purchase/current value; and other income for parking or utilities. For financing records, only enter information appropriate for your workspace access.</p>
          <h3 style={{ marginTop: 28 }}>Saved records</h3>
          {propertyRecords.length ? <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr>{["Type", "Details", "Amount", "Date", "Due / expiry", "Status", "Update"].map((v) => <th key={v} style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #dce4dc" }}>{v}</th>)}</tr></thead>
            <tbody>{propertyRecords.map((r: any) => <tr key={r.id}>
              <td style={{ padding: 10, borderBottom: "1px solid #edf0eb" }}>{labels[r.record_type] ?? r.record_type}</td>
              <td style={{ padding: 10, borderBottom: "1px solid #edf0eb" }}><b>{r.title}</b>{r.notes && <div style={{ color: "#78847d", maxWidth: 260 }}>{r.notes}</div>}</td>
              <td style={{ padding: 10, borderBottom: "1px solid #edf0eb" }}>{r.amount === null ? "—" : money(Number(r.amount))}</td>
              <td style={{ padding: 10, borderBottom: "1px solid #edf0eb" }}>{r.record_date}</td>
              <td style={{ padding: 10, borderBottom: "1px solid #edf0eb" }}>{r.due_date || "—"}</td>
              <td style={{ padding: 10, borderBottom: "1px solid #edf0eb" }}>{r.status.replace("_", " ")}</td>
              <td style={{ padding: 10, borderBottom: "1px solid #edf0eb" }}><form action={updatePortfolioRecordStatus} style={{ display: "flex", gap: 5 }}><input type="hidden" name="record_id" value={r.id} /><input type="hidden" name="property_id" value={selected.id} /><select name="status" defaultValue={r.status} aria-label={"Update status for " + r.title} style={{ ...field, margin: 0, minWidth: 115, padding: 7 }}>{["recorded", "planned", "in_progress", "completed", "paid", "overdue"].map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}</select><button style={{ ...button, padding: "7px 9px" }}>Save</button></form></td>
            </tr>)}</tbody></table></div> : <p style={{ color: "#687573" }}>No portfolio details recorded for this property yet. Add the first item above.</p>}
        </>}
      </section>
      <section style={{ marginTop: 24 }}>
        <h2>Property snapshot</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 12 }}>
          {propertyList.map((p: any) => {
            const pu = unitList.filter((u: any) => u.property_id === p.id);
            const pl = leaseList.filter((l: any) => pu.some((u: any) => u.id === l.unit_id));
            const plIds = new Set(pl.map((l: any) => l.id));
            const pc = chargeList.filter((c: any) => plIds.has(c.lease_id));
            const pr = recordList.filter((r: any) => r.property_id === p.id);
            const paid = pc.reduce((s: number, c: any) => s + Number(c.amount_paid || 0), 0);
            const exp = sumType(pr, "expense") + sumType(pr, "maintenance");
            return <a key={p.id} href={"/dashboard/portfolio?property=" + p.id} style={{ ...card, color: "inherit", textDecoration: "none" }}><b>{p.name}</b><p style={{ color: "#687573", fontSize: 13 }}>{pu.length} units · {pu.length ? Math.round((pu.filter((u: any) => u.status === "occupied").length / pu.length) * 100) : 0}% occupied</p><p style={{ marginBottom: 0 }}>Collected {money(paid)} · Expenses {money(exp)}</p></a>;
          })}
        </div>
      </section>
    </section>
  </main>;
}
