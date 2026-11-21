import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addPortfolioRecord } from "./actions";

const card: React.CSSProperties = { background: "#fff", border: "1px solid #dce4dc", borderRadius: 12, padding: 20 };
const input: React.CSSProperties = { width: "100%", padding: 11, border: "1px solid #cfd9d0", borderRadius: 7, marginTop: 6, marginBottom: 12, color: "#132c2a", background: "#fff" };
const button: React.CSSProperties = { width: "100%", padding: 12, border: 0, borderRadius: 7, background: "#183b32", color: "#fff", fontWeight: 700, cursor: "pointer" };
const money = (value: number) => "KES " + Math.round(value).toLocaleString("en-KE");
const types: Record<string,string> = { expense: "Expenses", maintenance: "Maintenance", compliance: "Compliance", mortgage: "Mortgage", valuation: "Property valuation", other_income: "Other income" };

export default async function PortfolioPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/login?next=%2Fdashboard%2Fportfolio");

  const { data: memberships } = await supabase.from("organization_members")
    .select("organization_id,role,organizations(id,name)")
    .eq("user_id", userId);
  const membership = memberships?.find((item: any) => ["landlord","property_manager","accountant"].includes(item.role));
  const org = membership ? (Array.isArray(membership.organizations) ? membership.organizations[0] : membership.organizations) : null;
  if (!org) return <main style={{ padding: 32, background: "#f3f2ec", minHeight: "100vh", color: "#132c2a" }}><a href="/dashboard/operations">← Property operations</a><h1>Portfolio workspace unavailable</h1><p>Create or select a landlord workspace first.</p></main>;

  const [propertyResult, unitResult, leaseResult, chargeResult, recordResult] = await Promise.all([
    supabase.from("properties").select("id,name,address,county").eq("organization_id", org.id).order("name").limit(500),
    supabase.from("units").select("id,property_id,status,monthly_rent").eq("organization_id", org.id).limit(2000),
    supabase.from("leases").select("id,unit_id,status,monthly_rent").eq("organization_id", org.id).eq("status","active").limit(2000),
    supabase.from("rent_charges").select("lease_id,amount,amount_paid,status").eq("organization_id", org.id).limit(5000),
    supabase.from("property_portfolio_records").select("id,property_id,record_type,title,amount,record_date,due_date,status,notes").eq("organization_id", org.id).order("record_date",{ascending:false}).limit(2000),
  ]);
  const properties = propertyResult.data ?? [];
  const units = unitResult.data ?? [];
  const leases = leaseResult.data ?? [];
  const charges = chargeResult.data ?? [];
  const records = recordResult.data ?? [];
  const loadError = [propertyResult.error,unitResult.error,leaseResult.error,chargeResult.error,recordResult.error].some(Boolean);
  const leaseUnit = new Map(leases.map((lease:any) => [lease.id, lease.unit_id]));
  const unitProperty = new Map(units.map((unit:any) => [unit.id, unit.property_id]));
  const rentExpected = leases.reduce((sum:number, lease:any) => sum + Number(lease.monthly_rent || 0), 0);
  const totalCollected = charges.reduce((sum:number, charge:any) => sum + Number(charge.amount_paid || 0), 0);
  const totalCharged = charges.reduce((sum:number, charge:any) => sum + Number(charge.amount || 0), 0);
  const outstanding = Math.max(0, totalCharged - totalCollected);
  const totalExpenses = records.filter((r:any) => ["expense","maintenance","mortgage"].includes(r.record_type)).reduce((sum:number,r:any)=>sum+Number(r.amount||0),0);
  const otherIncome = records.filter((r:any) => r.record_type === "other_income").reduce((sum:number,r:any)=>sum+Number(r.amount||0),0);
  const fmtDate = (value:string|null) => value ? new Date(value+"T00:00:00").toLocaleDateString("en-KE",{day:"numeric",month:"short",year:"numeric"}) : "—";

  const errorText: Record<string,string> = {
    validation:"Check the title, dates, status and amount. Amounts must be zero or greater.",
    access:"Your account does not have permission to add portfolio records in this workspace.",
    property:"The selected property could not be found in this workspace.",
    save:"The record could not be saved. Please refresh and try again.",
  };
  const field = (name:string,label:string,type="text",required=false) => <label style={{display:"block",fontSize:12,fontWeight:700}}>{label}<input name={name} type={type} required={required} style={input}/></label>;

  return <main style={{minHeight:"100vh",background:"#f3f2ec",color:"#132c2a",padding:"26px 5%"}}>
    <header style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:16,borderBottom:"1px solid #d8dfd6",paddingBottom:18,flexWrap:"wrap"}}>
      <a href="/dashboard" style={{fontWeight:800,fontSize:20,color:"#183b32",textDecoration:"none"}}>PropertyOS AI</a>
      <nav style={{display:"flex",gap:18,flexWrap:"wrap"}}><a href="/dashboard/operations">Property operations</a><a href="/dashboard">Overview</a></nav>
    </header>
    <section style={{maxWidth:1240,margin:"34px auto"}}>
      <p style={{color:"#6d9e8b",fontSize:11,letterSpacing:2}}>PORTFOLIO INTELLIGENCE · {org.name}</p>
      <h1 style={{fontSize:38,margin:"8px 0"}}>See the whole picture.</h1>
      <p style={{color:"#687573",lineHeight:1.6}}>A property-by-property view of rental income, costs and important operational records.</p>
      {loadError && <div role="alert" style={{...card,background:"#fff4e5",color:"#75420d",margin:"16px 0"}}>Some portfolio information could not be loaded. Figures may be incomplete; refresh and check your workspace records.</div>}
      {params.error && <p role="alert" style={{padding:12,background:"#f9e8e2",color:"#8a3829",borderRadius:8}}>{errorText[params.error] ?? "Something went wrong."}</p>}
      {params.saved && <p role="status" style={{padding:12,background:"#e5f1e9",color:"#245a3e",borderRadius:8}}>Portfolio detail saved successfully.</p>}
      {recordResult.error && <p role="alert" style={{padding:12,background:"#fff4e5",color:"#75420d",borderRadius:8}}>Portfolio records are not available yet. Apply the Portfolio Intelligence database migration before using this section.</p>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(175px,1fr))",gap:12,margin:"24px 0"}}>
        {[[ "Properties",properties.length ],[ "Units",units.length ],[ "Occupancy",units.length ? Math.round(units.filter((u:any)=>u.status==="occupied").length/units.length*100)+"%" : "—" ],[ "Monthly rent run-rate",money(rentExpected) ],[ "Rent collected (records)",money(totalCollected) ],[ "Outstanding rent",money(outstanding) ],[ "Recorded costs",money(totalExpenses) ],[ "Other income",money(otherIncome) ]].map(([label,value])=><article key={String(label)} style={card}><small style={{color:"#687573"}}>{label}</small><div style={{fontSize:23,fontWeight:800,marginTop:8}}>{value}</div></article>)}
      </div>
      <h2 style={{fontSize:24,margin:"32px 0 14px"}}>Property performance</h2>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:14}}>
        {properties.map((property:any)=>{
          const propertyUnits = units.filter((u:any)=>u.property_id===property.id);
          const propertyLeases = leases.filter((l:any)=>propertyUnits.some((u:any)=>u.id===l.unit_id));
          const propertyLeaseIds = new Set(propertyLeases.map((l:any)=>l.id));
          const propertyCharges = charges.filter((c:any)=>propertyLeaseIds.has(c.lease_id));
          const propertyRecords = records.filter((r:any)=>r.property_id===property.id);
          const collected = propertyCharges.reduce((s:number,c:any)=>s+Number(c.amount_paid||0),0);
          const billed = propertyCharges.reduce((s:number,c:any)=>s+Number(c.amount||0),0);
          const expenses = propertyRecords.filter((r:any)=>["expense","maintenance","mortgage"].includes(r.record_type)).reduce((s:number,r:any)=>s+Number(r.amount||0),0);
          const income = propertyRecords.filter((r:any)=>r.record_type==="other_income").reduce((s:number,r:any)=>s+Number(r.amount||0),0);
          const occupied = propertyUnits.filter((u:any)=>u.status==="occupied").length;
          return <article key={property.id} style={card}>
            <div style={{display:"flex",justifyContent:"space-between",gap:8}}><h3 style={{margin:"0 0 6px"}}>{property.name}</h3><span style={{fontSize:11,color:"#6d9e8b"}}>{propertyUnits.length} units</span></div>
            <small style={{color:"#687573"}}>{property.address||property.county||"Address not added"}</small>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:18}}>
              <div><small>Occupancy</small><b style={{display:"block",marginTop:4}}>{propertyUnits.length?Math.round(occupied/propertyUnits.length*100)+"%":"—"}</b></div>
              <div><small>Rent collected</small><b style={{display:"block",marginTop:4}}>{money(collected)}</b></div>
              <div><small>Outstanding</small><b style={{display:"block",marginTop:4}}>{money(Math.max(0,billed-collected))}</b></div>
              <div><small>Recorded costs</small><b style={{display:"block",marginTop:4}}>{money(expenses)}</b></div>
              <div><small>Other income</small><b style={{display:"block",marginTop:4}}>{money(income)}</b></div>
              <div><small>Net recorded</small><b style={{display:"block",marginTop:4}}>{money(collected+income-expenses)}</b></div>
            </div>
            <p style={{fontSize:12,color:"#687573",marginBottom:0}}>{propertyRecords.length} additional records · rent values use recorded charges and payments</p>
          </article>;
        })}
        {!properties.length && <article style={card}>No properties yet. Add a property in <a href="/dashboard/operations">Property operations</a> to begin.</article>}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:18,marginTop:28,alignItems:"start"}}>
        <article style={card}>
          <h2 style={{marginTop:0}}>Add portfolio details</h2>
          <p style={{fontSize:13,color:"#687573",lineHeight:1.6}}>Choose the property this record belongs to. It will appear in both the property view and the portfolio totals.</p>
          <form action={addPortfolioRecord}>
            <input type="hidden" name="organization_id" value={org.id}/>
            <label style={{display:"block",fontSize:12,fontWeight:700}}>Property<select name="property_id" required style={input}><option value="">Choose property…</option>{properties.map((p:any)=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
            <label style={{display:"block",fontSize:12,fontWeight:700}}>Record type<select name="record_type" required style={input}>{Object.entries(types).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
            {field("title","Description", "text", true)}
            {field("amount","Amount / value (KES)", "number")}
            {field("record_date","Record date","date",true)}
            {field("due_date","Due / expiry date","date")}
            <label style={{display:"block",fontSize:12,fontWeight:700}}>Status<select name="status" style={input}><option value="recorded">Recorded</option><option value="planned">Planned</option><option value="in_progress">In progress</option><option value="completed">Completed</option><option value="paid">Paid</option><option value="overdue">Overdue</option></select></label>
            <label style={{display:"block",fontSize:12,fontWeight:700}}>Notes<textarea name="notes" maxLength={2000} rows={3} style={{...input,resize:"vertical"}}/></label>
            <button style={button} disabled={!properties.length}>Save property detail</button>
          </form>
        </article>
        <article style={card}>
          <h2 style={{marginTop:0}}>Recent property records</h2>
          {records.length ? records.slice(0,15).map((record:any)=>{
            const property = properties.find((p:any)=>p.id===record.property_id);
            return <div key={record.id} style={{padding:"12px 0",borderBottom:"1px solid #edf0eb"}}>
              <div style={{display:"flex",justifyContent:"space-between",gap:10}}><b>{record.title}</b><small>{record.amount===null?"—":money(Number(record.amount))}</small></div>
              <small style={{color:"#687573"}}>{property?.name??"Property"} · {types[record.record_type]??record.record_type} · {fmtDate(record.record_date)}</small>
              {record.due_date&&<div style={{fontSize:12,marginTop:4}}>Due / expiry: {fmtDate(record.due_date)}</div>}
              {record.notes&&<p style={{fontSize:12,color:"#687573",margin:"5px 0 0"}}>{record.notes}</p>}
            </div>;
          }) : <p style={{color:"#687573"}}>No extra details recorded yet. Use the form to add expenses, maintenance, compliance dates, mortgage details, valuations or other income.</p>}
        </article>
      </div>
      <p style={{fontSize:12,color:"#687573",lineHeight:1.6,marginTop:20}}>Figures are calculated from the records currently available in this workspace. They are management summaries, not audited accounts or tax advice. Add complete records for reliable results.</p>
    </section>
  </main>;
}
