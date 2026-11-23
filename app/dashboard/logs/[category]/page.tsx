import { redirect,notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
const allowed=["properties","units","tenants","leases","rent","payments","maintenance","concerns"];
const labels:Record<string,string>={properties:"Properties",units:"Units",tenants:"Tenants",leases:"Leases",rent:"Rent & charges",payments:"Payments",maintenance:"Maintenance",concerns:"Concerns"};
const card:React.CSSProperties={background:"rgba(255,255,255,.76)",backdropFilter:"blur(18px)",border:"1px solid rgba(255,255,255,.86)",borderRadius:14,padding:17,boxShadow:"0 12px 32px rgba(19,44,42,.06)"};
export default async function CategoryLogPage({params}:{params:Promise<{category:string}>}) {
 const {category}=await params; if(!allowed.includes(category)) notFound();
 const supabase=await createClient(); const {data:claims}=await supabase.auth.getClaims(); const uid=claims?.claims?.sub;
 if(!uid) redirect("/login");
 const {data:members}=await supabase.from("organization_members").select("organization_id,organizations(id,name)").eq("user_id",uid).in("role",["landlord","property_manager","accountant"]);
 const m=members?.[0]; const org=m?(Array.isArray(m.organizations)?m.organizations[0]:m.organizations):null;
 if(!org) return <main style={{padding:30}}>No landlord workspace found. <a href="/dashboard/operations">Back to workspace</a></main>;
 const {data:logs,error}=await supabase.from("workspace_activity_logs").select("id,category,entity_id,action,summary,actor_user_id,created_at").eq("organization_id",org.id).eq("category",category).order("created_at",{ascending:false}).limit(300);
 return <main style={{minHeight:"100vh",padding:"28px 5%",background:"linear-gradient(135deg,#f3f5ef,#e9eee8 55%,#f4f3ed)",color:"#183b32"}}><section style={{maxWidth:1100,margin:"20px auto"}}>
 <a href="/dashboard/operations" style={{fontWeight:700,color:"#315e4d"}}>← Back to workspace</a><p style={{fontSize:11,letterSpacing:2,color:"#6d9e8b",marginTop:24}}>ACTIVITY HISTORY · {org.name}</p><h1 style={{fontSize:34,margin:"8px 0"}}>{labels[category]} log</h1><p style={{color:"#687573",lineHeight:1.6}}>A time-ordered history of changes in this category. The log records the event type and time, not private form contents.</p>
 <div style={{display:"flex",gap:8,flexWrap:"wrap",margin:"16px 0 22px"}}>{allowed.map(c=><a key={c} href={"/dashboard/logs/"+c} style={{padding:"8px 11px",borderRadius:8,background:c===category?"#183b32":"rgba(255,255,255,.72)",color:c===category?"#fff":"#315e4d",fontSize:12,fontWeight:700,textDecoration:"none"}}>{labels[c]}</a>)}</div>
 {error?<p role="alert">The activity log could not be loaded. Please refresh.</p>:logs?.length? <div style={{display:"grid",gap:10}}>{logs.map((log:any)=><article key={log.id} style={card}><div style={{display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}><b>{log.summary}</b><span style={{fontSize:11,color:"#718078"}}>{new Date(log.created_at).toLocaleString("en-KE")}</span></div><p style={{fontSize:12,color:"#718078",margin:"7px 0 0"}}>{log.action.toUpperCase()} · Record {String(log.entity_id??"—").slice(0,8)} · {log.actor_user_id?"User "+log.actor_user_id.slice(0,8):"System / integration"}</p></article>)}</div>:<article style={card}><b>No activity recorded yet.</b><p style={{fontSize:13,color:"#718078"}}>When a record in this category is created, changed or deleted, its activity will appear here.</p></article>}
 </section></main>;
}
