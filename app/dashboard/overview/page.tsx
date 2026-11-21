import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const money=(n:number)=>"KES "+Math.round(n).toLocaleString("en-KE");
const panel:React.CSSProperties={background:"#fff",border:"1px solid #dce4dc",borderRadius:12,padding:20};
export default async function WorkspaceOverview(){
 const supabase=await createClient();
 const {data:claims}=await supabase.auth.getClaims();
 const userId=claims?.claims?.sub;
 if(!userId) redirect("/login?next=%2Fdashboard%2Foverview");
 const {data:memberships}=await supabase.from("organization_members").select("organization_id,role,organizations(id,name)").eq("user_id",userId);
 const member=memberships?.find((x:any)=>["landlord","property_manager","accountant","caretaker"].includes(x.role));
 const org=member?(Array.isArray(member.organizations)?member.organizations[0]:member.organizations):null;
 if(!org) redirect("/dashboard");
 const [propertiesQ,unitsQ,tenantsQ,leasesQ,chargesQ,paymentsQ,expensesQ]=await Promise.all([
  supabase.from("properties").select("id",{count:"exact",head:true}).eq("organization_id",org.id),
  supabase.from("units").select("id,status").eq("organization_id",org.id).limit(2000),
  supabase.from("tenants").select("id",{count:"exact",head:true}).eq("organization_id",org.id),
  supabase.from("leases").select("id",{count:"exact",head:true}).eq("organization_id",org.id).eq("status","active"),
  supabase.from("rent_charges").select("id,billing_period,amount,amount_paid,status,due_date").eq("organization_id",org.id).order("due_date",{ascending:false}).limit(1500),
  supabase.from("payments").select("id,amount,status,created_at").eq("organization_id",org.id).order("created_at",{ascending:false}).limit(10),
  supabase.from("property_portfolio_records").select("id,amount,record_type,record_date").eq("organization_id",org.id).order("record_date",{ascending:false}).limit(1000)
 ]);
 const charges=chargesQ.data??[], units=unitsQ.data??[], payments=paymentsQ.data??[], expenses=expensesQ.data??[];
 const charged=charges.reduce((s:number,c:any)=>s+Number(c.amount||0),0);
 const collected=charges.reduce((s:number,c:any)=>s+Number(c.amount_paid||0),0);
 const outstanding=Math.max(0,charged-collected);
 const occupied=units.filter((u:any)=>u.status==="occupied").length;
 const months=Array.from({length:6},(_,i)=>{const d=new Date();d.setDate(1);d.setMonth(d.getMonth()-(5-i));return {key:d.toISOString().slice(0,7),label:d.toLocaleDateString("en",{month:"short"}),rent:0,paid:0,expenses:0};});
 for(const c of charges){const m=months.find(x=>x.key===String(c.billing_period).slice(0,7));if(m){m.rent+=Number(c.amount||0);m.paid+=Number(c.amount_paid||0);}}
 for(const e of expenses){const m=months.find(x=>x.key===String(e.record_date).slice(0,7));if(m&&["expense","maintenance","mortgage"].includes(e.record_type))m.expenses+=Number(e.amount||0);}
 const peak=Math.max(1,...months.flatMap(m=>[m.rent,m.paid,m.expenses]));
 const loadError=[propertiesQ.error,unitsQ.error,tenantsQ.error,leasesQ.error,chargesQ.error,paymentsQ.error,expensesQ.error].some(Boolean);
 return <main style={{padding:"30px 4.5%",maxWidth:1450,margin:"0 auto"}}>
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:16,flexWrap:"wrap"}}><div><p style={{fontSize:11,letterSpacing:2,color:"#6d9e8b",fontWeight:800}}>LANDLORD WORKSPACE · {org.name}</p><h1 style={{fontSize:34,letterSpacing:-1.5,margin:"8px 0"}}>Portfolio overview</h1><p style={{color:"#687573",margin:0}}>A quick view of property performance and rent activity.</p></div><a href="/dashboard/operations" style={{background:"#183b32",color:"#fff",padding:"12px 16px",borderRadius:7,textDecoration:"none",fontWeight:700,fontSize:13}}>Manage properties →</a></div>
  {loadError&&<p role="alert" style={{padding:12,background:"#fff0df",borderRadius:8,color:"#75420d"}}>Some figures could not be loaded. Refresh and check the workspace records.</p>}
  <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))",gap:12,margin:"26px 0"}}>
   {[["Properties",propertiesQ.count??0],["Units",units.length],["Occupied units",occupied],["Tenants",tenantsQ.count??0],["Active leases",leasesQ.count??0],["Rent outstanding",money(outstanding)]].map(([label,value])=><article key={String(label)} style={panel}><div style={{fontSize:12,color:"#687573"}}>{label}</div><strong style={{display:"block",fontSize:23,marginTop:9}}>{value}</strong></article>)}
  </section>
  <section id="workspace-charts" style={{display:"grid",gridTemplateColumns:"minmax(0,1.6fr) minmax(260px,1fr)",gap:16,alignItems:"start"}}>
   <article style={panel}><div style={{display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}><div><h2 style={{fontSize:18,margin:"0 0 5px"}}>Rent performance</h2><p style={{fontSize:12,color:"#687573",margin:0}}>Last six billing months · KES</p></div><div style={{fontSize:12,color:"#687573"}}><span style={{color:"#2e8061"}}>■</span> Collected　<span style={{color:"#b6c9bb"}}>■</span> Charged</div></div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(6,minmax(0,1fr))",gap:10,alignItems:"end",height:205,marginTop:22}}>{months.map(m=><div key={m.key} style={{height:"100%",display:"flex",flexDirection:"column",justifyContent:"end",alignItems:"center",gap:7}}><div title={"Charged "+money(m.rent)+" · Collected "+money(m.paid)} style={{height:150,width:"100%",display:"flex",alignItems:"end",justifyContent:"center",gap:3,borderBottom:"1px solid #e4e9e3"}}><div style={{width:"36%",height:Math.max(2,m.rent/peak*145),background:"#c8d9cc",borderRadius:"4px 4px 0 0"}}/><div style={{width:"36%",height:Math.max(2,m.paid/peak*145),background:"#328064",borderRadius:"4px 4px 0 0"}}/></div><small style={{fontSize:11,color:"#687573"}}>{m.label}</small></div>)}</div>
    <div style={{marginTop:14,display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap",fontSize:12}}><span>Rent charged: <b>{money(charged)}</b></span><span>Rent collected: <b style={{color:"#287453"}}>{money(collected)}</b></span></div>
   </article>
   <article style={panel}><h2 style={{fontSize:18,margin:"0 0 5px"}}>Collection snapshot</h2><p style={{fontSize:12,color:"#687573",margin:"0 0 18px"}}>Across loaded rent-charge records</p><div style={{fontSize:30,fontWeight:850}}>{charged?Math.round(collected/charged*100):0}%</div><div style={{height:10,background:"#edf1ec",borderRadius:20,overflow:"hidden",margin:"12px 0"}}><div style={{height:"100%",width:(charged?Math.min(100,collected/charged*100):0)+"%",background:"#328064",borderRadius:20}}/></div><div style={{display:"grid",gap:12,marginTop:20}}><div><small style={{color:"#687573"}}>Collected</small><b style={{display:"block"}}>{money(collected)}</b></div><div><small style={{color:"#687573"}}>Outstanding</small><b style={{display:"block"}}>{money(outstanding)}</b></div><div><small style={{color:"#687573"}}>Recent payments</small><b style={{display:"block"}}>{payments.length} records</b></div></div></article>
  </section>
  <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:16,marginTop:16}}>
   <article style={panel}><h2 style={{fontSize:17,marginTop:0}}>Expenses by month</h2><p style={{fontSize:12,color:"#687573"}}>Portfolio expenses and maintenance, by record date</p>{months.map(m=><div key={m.key} style={{display:"grid",gridTemplateColumns:"42px 1fr auto",gap:10,alignItems:"center",margin:"12px 0",fontSize:12}}><span>{m.label}</span><div style={{height:7,background:"#edf1ec",borderRadius:10}}><div style={{height:7,width:(m.expenses/Math.max(1,...months.map(x=>x.expenses))*100)+"%",background:"#c58a4b",borderRadius:10}}/></div><b>{money(m.expenses)}</b></div>)}</article>
   <article style={panel}><h2 style={{fontSize:17,marginTop:0}}>Quick actions</h2><div style={{display:"grid",gap:10}}>{[["Add a property","/dashboard/operations#add-property"],["Add a tenant","/dashboard/operations#add-tenant"],["Create a lease","/dashboard/operations#create-lease"],["Raise a rent charge","/dashboard/operations#raise-rent-charge"],["Manage payment methods","/dashboard/operations#workspace-payments"]].map(([label,href])=><a key={label} href={href} style={{padding:12,border:"1px solid #e1e7df",borderRadius:7,textDecoration:"none",color:"#183b32",fontSize:13,fontWeight:700}}>{label} →</a>)}</div></article>
  </section>
 </main>;
}
