import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addMaintenanceRequest, updateMaintenancePayment, saveWellbeingReport, sendWellbeingReport } from "./actions";

const card: React.CSSProperties = { background: "rgba(255,255,255,.72)", backdropFilter: "blur(18px)", border: "1px solid rgba(255,255,255,.86)", borderRadius: 16, padding: 20, boxShadow: "0 14px 38px rgba(19,44,42,.07)" };
const field: React.CSSProperties = { width: "100%", padding: 11, border: "1px solid #cfd9d0", borderRadius: 7, marginTop: 6, marginBottom: 12, background: "#fff", color: "#132c2a" };
const button: React.CSSProperties = { padding: "11px 15px", border: 0, borderRadius: 7, background: "#183b32", color: "#fff", fontWeight: 700, cursor: "pointer" };
const money = (value: number) => "KES " + Math.round(value || 0).toLocaleString("en-KE");
const input = (name: string, label: string, type = "text", required = true) => <label style={{ display: "block", fontSize: 12, fontWeight: 650 }}>{label}<input name={name} type={type} required={required} style={field} /></label>;
const select = (name: string, label: string, options: { value: string; label: string }[]) => <label style={{ display: "block", fontSize: 12, fontWeight: 650 }}>{label}<select name={name} required style={field}>{options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></label>;

export default async function WellbeingPage({ searchParams }: { searchParams: Promise<{ property?: string; error?: string; success?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/login?next=%2Fdashboard%2Fwellbeing");
  const { data: memberships, error: membershipError } = await supabase.from("organization_members")
    .select("organization_id,role,organizations(id,name)").eq("user_id", userId)
    .in("role", ["landlord", "property_manager", "accountant"]);
  if (membershipError) return <main style={{ padding: 30 }}>We could not verify workspace access. Please refresh or sign in again.</main>;
  const member = memberships?.[0];
  const org = member ? (Array.isArray(member.organizations) ? member.organizations[0] : member.organizations) : null;
  if (!org) return <main style={{ padding: 30 }}><h1>Property wellbeing</h1><p>Create or open a landlord workspace first.</p><a href="/dashboard/operations">Back to workspace</a></main>;

  const [{ data: properties }, { data: units }, { data: leases }, { data: charges }, { data: maintenance }, { data: reports }] = await Promise.all([
    supabase.from("properties").select("id,name,address").eq("organization_id", org.id).order("name"),
    supabase.from("units").select("id,property_id,unit_number,status").eq("organization_id", org.id).order("unit_number"),
    supabase.from("leases").select("id,unit_id,monthly_rent,status").eq("organization_id", org.id).eq("status", "active"),
    supabase.from("rent_charges").select("id,lease_id,amount,amount_paid,due_date").eq("organization_id", org.id).limit(5000),
    supabase.from("maintenance_requests").select("id,property_id,unit_id,title,description,priority,status,estimated_cost,actual_cost,amount_paid,payment_status,payment_reference,reported_at").eq("organization_id", org.id).order("created_at", { ascending: false }).limit(500),
    supabase.from("property_wellbeing_reports").select("id,property_id,title,report_body,period_start,period_end,metrics,recipient_email,sent_at,created_at").eq("organization_id", org.id).order("created_at", { ascending: false }).limit(100),
  ]);
  const propertyList = properties ?? [], unitList = units ?? [], leaseList = leases ?? [], chargeList = charges ?? [], maintenanceList = maintenance ?? [], reportList = reports ?? [];
  const selected = propertyList.find((p) => p.id === params.property) ?? propertyList[0] ?? null;
  const selectedUnits = selected ? unitList.filter((u) => u.property_id === selected.id) : [];
  const selectedUnitIds = new Set(selectedUnits.map((u) => u.id));
  const selectedLeases = leaseList.filter((l) => selectedUnitIds.has(l.unit_id));
  const selectedLeaseIds = new Set(selectedLeases.map((l) => l.id));
  const selectedCharges = chargeList.filter((c) => selectedLeaseIds.has(c.lease_id));
  const selectedMaintenance = maintenanceList.filter((m) => m.property_id === selected?.id);
  const collected = selectedCharges.reduce((sum, c) => sum + Number(c.amount_paid || 0), 0);
  const charged = selectedCharges.reduce((sum, c) => sum + Number(c.amount || 0), 0);
  const occupied = selectedUnits.filter((u) => u.status === "occupied").length;
  const occupancy = selectedUnits.length ? Math.round(occupied / selectedUnits.length * 100) : 0;
  const maintenanceCost = selectedMaintenance.reduce((sum, m) => sum + Number(m.actual_cost ?? m.estimated_cost ?? 0), 0);
  const maintenancePaid = selectedMaintenance.reduce((sum, m) => sum + Number(m.amount_paid || 0), 0);
  const maintenanceOutstanding = Math.max(0, maintenanceCost - maintenancePaid);
  const errors: Record<string,string> = {
    access: "Your account does not have permission for this workspace or property.",
    maintenance_validation: "Check the property, unit, description, priority and non-negative cost amounts.",
    maintenance_save: "The repair item could not be saved. Please try again.",
    payment_validation: "Payment must be a non-negative amount and cannot exceed the actual repair cost. Enter the final cost first if needed.",
    payment_save: "The repair payment could not be updated.",
    report_validation: "Check the report title, dates, email address and report length.",
    report_save: "The wellbeing report could not be saved.",
    recipient: "Enter a valid recipient email address.",
    email_config: "Direct email is not configured yet. Add RESEND_API_KEY and RESEND_FROM_EMAIL to the production environment.",
    email_send: "The email provider could not send this report. Check the email configuration and try again.",
    sent_status: "The email provider accepted the message, but the sent status could not be saved. Check the email provider before retrying.",
  };
  const successes: Record<string,string> = { maintenance_added:"Repair item added.", payment_updated:"Repair payment status updated.", report_saved:"Wellbeing report saved.", report_sent:"Wellbeing report emailed successfully." };
  const reportRows = selected ? reportList.filter((r) => r.property_id === selected.id) : [];
  const maxBar = Math.max(1, charged, collected, maintenanceCost);
  const bar = (label: string, value: number, percent: number, fill: string) => <div style={{ margin: "13px 0" }}><div style={{ display:"flex",justifyContent:"space-between",fontSize:12,gap:12 }}><b>{label}</b><span>{money(value)}</span></div><div style={{ height:10,background:"#e7ede8",borderRadius:20,overflow:"hidden",marginTop:6 }}><div style={{ height:"100%",width:Math.max(1,percent)+"%",background:fill,borderRadius:20 }} /></div></div>;
  return <main style={{ minHeight:"100vh",background:"radial-gradient(ellipse at 12% 0%,rgba(175,211,192,.35),transparent 34%),radial-gradient(ellipse at 92% 18%,rgba(184,205,196,.34),transparent 30%),linear-gradient(135deg,#f3f5ef,#e9eee8 55%,#f4f3ed)",color:"#132c2a",padding:"28px 5%" }}>
    <section style={{maxWidth:1240,margin:"20px auto"}}>
      <a href="/dashboard/operations" style={{color:"#315e4d",fontWeight:700,fontSize:13}}>← Back to Workspace</a>
      <p style={{color:"#6d9e8b",fontSize:11,letterSpacing:2,marginTop:24}}>PROPERTY WELLBEING · {org.name}</p>
      <h1 style={{fontSize:36,margin:"8px 0"}}>Property wellbeing & maintenance.</h1>
      <p style={{color:"#687573",lineHeight:1.6}}>Assess property condition, track repairs and payments, and prepare reports for owners or stakeholders.</p>
      {params.error && <p role="alert" style={{padding:12,borderRadius:8,background:"#f9e8e2",color:"#8a3829"}}>{errors[params.error] ?? "Something went wrong."}</p>}
      {params.success && <p role="status" style={{padding:12,borderRadius:8,background:"#e5f1e9",color:"#245a3e"}}>{successes[params.success] ?? "Saved."}</p>}
      <section style={{...card,marginTop:20}}>
        <form method="get" style={{display:"flex",gap:12,alignItems:"end",flexWrap:"wrap"}}>
          <label style={{fontSize:12,fontWeight:700,flex:"1 1 260px"}}>Choose property<select name="property" defaultValue={selected?.id ?? ""} style={field}>{propertyList.map((p)=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
          <button style={button}>View property</button>
        </form>
        {!selected ? <p>Add your first property in the workspace to start a wellbeing report.</p> : <>
          <h2 style={{margin:"6px 0"}}>{selected.name}</h2><p style={{marginTop:0,color:"#687573"}}>{selected.address || "Property address not added"}</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:10}}>
            {[["Occupancy",occupancy+"%"],["Units",String(selectedUnits.length)],["Rent collected",money(collected)],["Rent outstanding",money(Math.max(0,charged-collected))],["Repair costs",money(maintenanceCost)],["Repair balance",money(maintenanceOutstanding)]].map(([label,value])=><article key={label} style={{...card,padding:15}}><small style={{color:"#718078"}}>{label}</small><div style={{fontSize:21,fontWeight:800,marginTop:8}}>{value}</div></article>)}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(270px,1fr))",gap:16,marginTop:16}}>
            <article style={card}><h3 style={{marginTop:0}}>Property financial health</h3>{bar("Rent charged",charged,charged/maxBar*100,"#8cae9b")}{bar("Rent collected",collected,collected/maxBar*100,"#245c46")}{bar("Repair costs",maintenanceCost,maintenanceCost/maxBar*100,"#c58b47")}<p style={{fontSize:11,color:"#75827b"}}>Figures use recorded rent charges for this property and saved repair estimates or actual costs. They are not forecasts.</p></article>
            <article style={card}><h3 style={{marginTop:0}}>Property condition snapshot</h3><div style={{display:"flex",alignItems:"center",gap:18,flexWrap:"wrap"}}><div style={{width:112,height:112,borderRadius:"50%",background:`conic-gradient(#2f7455 ${occupancy}%,#e5ebe6 0)`,display:"grid",placeItems:"center"}}><div style={{width:78,height:78,borderRadius:"50%",background:"#fff",display:"grid",placeItems:"center",fontWeight:800,fontSize:20}}>{occupancy}%</div></div><div><b>Occupancy</b><p style={{fontSize:12,color:"#75827b"}}>{occupied} occupied of {selectedUnits.length} units</p><b>{selectedMaintenance.filter((m)=>!["completed","cancelled"].includes(m.status)).length} open repair items</b><p style={{fontSize:12,color:"#75827b"}}>{selectedMaintenance.filter((m)=>m.payment_status==="unpaid").length} unpaid · {selectedMaintenance.filter((m)=>m.payment_status==="partially_paid").length} partially paid</p></div></div></article>
          </div>
        </>}
      </section>

      <h2 style={{marginTop:30}}>Repair & maintenance tracker</h2>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(290px,1fr))",gap:16}}>
        <article style={card}><h3 style={{marginTop:0}}>Add a unit that needs fixing</h3><form action={addMaintenanceRequest}>
          <input type="hidden" name="organization_id" value={org.id}/>
          {select("property_id","Property",propertyList.map((p)=>({value:p.id,label:p.name})))}
          {select("unit_id","Unit (optional)",[{value:"",label:"Common area / whole property"},...unitList.map((u)=>({value:u.id,label:(propertyList.find((p)=>p.id===u.property_id)?.name ?? "Property")+" · "+u.unit_number}))])}
          {input("title","What needs fixing?")}
          <label style={{display:"block",fontSize:12,fontWeight:650}}>Details<textarea name="description" rows={3} maxLength={3000} style={{...field,resize:"vertical"}}/></label>
          {select("priority","Priority",["low","normal","high","urgent"].map((v)=>({value:v,label:v[0].toUpperCase()+v.slice(1)})))}
          {input("estimated_cost","Estimated cost (KES)","number",false)}
          {input("actual_cost","Actual cost (KES)","number",false)}
          <button style={button}>Save repair item</button>
        </form></article>
        <article style={card}><h3 style={{marginTop:0}}>Repair costs at a glance</h3><div style={{fontSize:27,fontWeight:800}}>{money(maintenanceCost)}</div><p style={{fontSize:12,color:"#718078"}}>Total estimated or actual cost for selected property</p><div style={{fontSize:23,fontWeight:800,color:"#246044"}}>{money(maintenancePaid)}</div><p style={{fontSize:12,color:"#718078"}}>Paid so far</p><div style={{fontSize:23,fontWeight:800,color:"#a65b32"}}>{money(maintenanceOutstanding)}</div><p style={{fontSize:12,color:"#718078"}}>Remaining balance</p><p style={{fontSize:12,color:"#718078"}}>Payment state is calculated from actual cost and amount paid. Record payments only after they have been made.</p></article>
      </div>
      <div style={{display:"grid",gap:12,marginTop:16}}>
        {selectedMaintenance.length ? selectedMaintenance.map((m)=>{
          const unit=unitList.find((u)=>u.id===m.unit_id);
          const total=Number(m.actual_cost ?? m.estimated_cost ?? 0);
          const statusColor=m.payment_status==="paid"?"#256344":m.payment_status==="partially_paid"?"#9a6b23":"#9a4a36";
          return <article key={m.id} style={card}>
            <div style={{display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}><div><b>{m.title}</b><p style={{margin:"5px 0",fontSize:12,color:"#718078"}}>{unit ? "Unit "+unit.unit_number : "Common area / property"} · {m.priority} priority · {m.status.replace("_"," ")}</p><p style={{fontSize:12,color:"#718078",whiteSpace:"pre-wrap"}}>{m.description}</p></div><span style={{alignSelf:"start",padding:"6px 10px",borderRadius:20,background:"#eef3ee",color:statusColor,fontSize:11,fontWeight:800}}>{m.payment_status.replace("_"," ")}</span></div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:8,margin:"12px 0"}}><div><small>Estimated</small><div><b>{m.estimated_cost===null?"—":money(Number(m.estimated_cost))}</b></div></div><div><small>Actual cost</small><div><b>{m.actual_cost===null?"—":money(Number(m.actual_cost))}</b></div></div><div><small>Paid</small><div><b>{money(Number(m.amount_paid))}</b></div></div><div><small>Balance</small><div><b>{money(Math.max(0,total-Number(m.amount_paid)))}</b></div></div></div>
            <form action={updateMaintenancePayment} style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10,alignItems:"end",borderTop:"1px solid #e6ece7",paddingTop:12}}>
              <input type="hidden" name="organization_id" value={org.id}/><input type="hidden" name="request_id" value={m.id}/>
              <label style={{fontSize:11,fontWeight:650}}>Actual cost (KES)<input name="actual_cost" type="number" min="0" step="0.01" defaultValue={m.actual_cost ?? m.estimated_cost ?? ""} required style={field}/></label>
              <label style={{fontSize:11,fontWeight:650}}>Total paid (KES)<input name="amount_paid" type="number" min="0" step="0.01" max={m.actual_cost ?? m.estimated_cost ?? undefined} defaultValue={m.amount_paid} required style={field}/></label>
              <label style={{fontSize:11,fontWeight:650}}>Payment reference<input name="payment_reference" defaultValue={m.payment_reference ?? ""} maxLength={100} style={field}/></label>
              <button style={button}>Update payment</button>
            </form>
          </article>;
        }) : <p style={{color:"#718078"}}>No repair items for this property yet.</p>}
      </div>

      <h2 style={{marginTop:32}}>Property wellbeing reports</h2>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(290px,1fr))",gap:16}}>
        <article style={card}><h3 style={{marginTop:0}}>Write a property report</h3><p style={{fontSize:12,color:"#718078"}}>A snapshot of rent, occupancy and maintenance figures is saved with your written observations.</p><form action={saveWellbeingReport}>
          <input type="hidden" name="organization_id" value={org.id}/>
          {select("property_id","Property",propertyList.map((p)=>({value:p.id,label:p.name})))}
          {input("title","Report title")}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{input("period_start","Period start","date")}{input("period_end","Period end","date")}</div>
          <label style={{display:"block",fontSize:12,fontWeight:650}}>Property wellbeing observations<textarea name="report_body" rows={6} maxLength={10000} placeholder="Describe the building condition, cleanliness, security, repairs needed, tenant feedback and actions planned…" style={{...field,resize:"vertical"}}/></label>
          {input("recipient_email","Recipient email (optional)","email",false)}
          <button style={button}>Save wellbeing report</button>
        </form></article>
        <article style={card}><h3 style={{marginTop:0}}>What the report measures</h3><ul style={{fontSize:13,lineHeight:2,color:"#50645a",paddingLeft:18}}><li>Occupancy and active units</li><li>Rent charged and collected for the report period</li><li>Outstanding rent balances</li><li>Open maintenance requests</li><li>Repair costs and payments</li><li>Your written property condition assessment</li></ul><p style={{fontSize:11,color:"#718078"}}>The charts above use the currently selected property. Saved report metrics are captured when the report is created.</p></article>
      </div>
      <div style={{display:"grid",gap:12,marginTop:14}}>
        {reportRows.length ? reportRows.map((r)=>{
          const metrics=r.metrics as Record<string,number>;
          return <article key={r.id} style={card}><div style={{display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}><div><b>{r.title}</b><p style={{fontSize:12,color:"#718078"}}>{r.period_start} – {r.period_end} · Created {new Date(r.created_at).toLocaleDateString("en-KE")}</p></div><span style={{fontSize:11,fontWeight:800,color:r.sent_at?"#256344":"#8b692e"}}>{r.sent_at?"Sent":"Saved · not sent"}</span></div><p style={{whiteSpace:"pre-wrap",fontSize:13,lineHeight:1.65}}>{r.report_body}</p><div style={{display:"flex",gap:14,flexWrap:"wrap",fontSize:12,color:"#53665c"}}><span>Occupancy: {metrics.occupancyPercent ?? 0}%</span><span>Rent collected: {money(metrics.rentCollected ?? 0)}</span><span>Arrears: {money(metrics.arrears ?? 0)}</span><span>Repair cost: {money(metrics.maintenanceCost ?? 0)}</span></div><form action={sendWellbeingReport} style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"end",marginTop:12}}><input type="hidden" name="organization_id" value={org.id}/><input type="hidden" name="report_id" value={r.id}/><label style={{fontSize:11,fontWeight:650,flex:"1 1 230px"}}>Send report to<input name="recipient_email" type="email" required defaultValue={r.recipient_email ?? ""} placeholder="recipient@example.com" style={field}/></label><button style={button}>Send report by email</button></form><p style={{fontSize:10,color:"#829087"}}>{r.sent_at ? "Last sent "+new Date(r.sent_at).toLocaleString("en-KE") : "Email delivery requires RESEND_API_KEY and RESEND_FROM_EMAIL in Vercel."}</p></article>;
        }) : <p style={{color:"#718078"}}>No reports saved for this property yet.</p>}
      </div>
    </section>
  </main>;
}
