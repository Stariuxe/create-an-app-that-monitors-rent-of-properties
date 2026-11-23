import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { raiseConcern, updateConcern } from "./actions";
const card:React.CSSProperties={background:"rgba(255,255,255,.76)",backdropFilter:"blur(18px)",border:"1px solid rgba(255,255,255,.86)",borderRadius:16,padding:20,boxShadow:"0 12px 32px rgba(19,44,42,.07)"};
const field:React.CSSProperties={width:"100%",padding:11,border:"1px solid #cfd9d0",borderRadius:7,marginTop:6,marginBottom:12,background:"#fff",color:"#132c2a"};
const btn:React.CSSProperties={padding:"11px 15px",border:0,borderRadius:7,background:"#183b32",color:"#fff",fontWeight:700};
export default async function ConcernsPage({searchParams}:{searchParams:Promise<{error?:string;success?:string}>}) {
 const params=await searchParams; const supabase=await createClient(); const {data:claims}=await supabase.auth.getClaims(); const uid=claims?.claims?.sub;
 if(!uid) redirect("/login?next=%2Fdashboard%2Fconcerns");
 const {data:members}=await supabase.from("organization_members").select("organization_id,role,organizations(id,name)").eq("user_id",uid).in("role",["landlord","property_manager","accountant"]);
 const member=members?.[0]; let org=member?(Array.isArray(member.organizations)?member.organizations[0]:member.organizations):null;
 let tenant:any=null; let tenantProperty:string|null=null; let tenantUnit:string|null=null;
 if(!org) {
  const {data:t}=await supabase.from("tenants").select("id,organization_id,full_name").eq("auth_user_id",uid).maybeSingle(); tenant=t;
  if(tenant){const {data:lease}=await supabase.from("leases").select("unit_id,units(property_id)").eq("tenant_id",tenant.id).eq("organization_id",tenant.organization_id).eq("status","active").maybeSingle();const unit=lease?(Array.isArray(lease.units)?lease.units[0]:lease.units):null;tenantUnit=lease?.unit_id??null;tenantProperty=unit?.property_id??null;
   const {data:o}=await supabase.from("organizations").select("id,name").eq("id",tenant.organization_id).maybeSingle();org=o;
  }
 }
 if(!org) return <main style={{padding:30}}>No landlord or tenant workspace was found. <a href="/dashboard/operations">Return to workspace</a></main>;
 const isStaff=Boolean(member);
 const [{data:properties},{data:units},{data:concerns}]=await Promise.all([
  supabase.from("properties").select("id,name").eq("organization_id",org.id).order("name"),
  supabase.from("units").select("id,property_id,unit_number").eq("organization_id",org.id).order("unit_number"),
  supabase.from("property_concerns").select("id,property_id,unit_id,tenant_id,category,title,description,priority,status,landlord_response,created_at,responded_at").eq("organization_id",org.id).order("created_at",{ascending:false}).limit(200)
 ]);
 const prop=properties??[],unitList=units??[],rows=concerns??[];
 const names=new Map(prop.map((p:any)=>[p.id,p.name]));
 const errors:Record<string,string>={access:"We could not verify access to this property.",validation:"Please check the concern title, description and category.",save:"The concern could not be saved. Please try again."};
 return <main style={{minHeight:"100vh",padding:"28px 5%",color:"#183b32",background:"linear-gradient(135deg,#f3f5ef,#e9eee8 55%,#f4f3ed)"}}><section style={{maxWidth:1120,margin:"18px auto"}}>
 <a href="/dashboard/operations" style={{fontWeight:700,color:"#315e4d"}}>← Back to workspace</a><p style={{fontSize:11,letterSpacing:2,color:"#6d9e8b",marginTop:24}}>PROPERTYOS AI · CONCERNS</p><h1 style={{fontSize:34,margin:"8px 0"}}>Raise a concern</h1>
 <p style={{color:"#687573",lineHeight:1.6}}>Report a maintenance issue, payment question, safety concern or anything affecting the property. Follow its progress and landlord response here.</p>
 {params.error&&<p role="alert" style={{background:"#f9e8e2",padding:12,borderRadius:8,color:"#8a3829"}}>{errors[params.error]??"Something went wrong."}</p>}
 {params.success&&<p role="status" style={{background:"#e5f1e9",padding:12,borderRadius:8,color:"#245a3e"}}>{params.success==="updated"?"Concern response updated.":"Concern submitted successfully."}</p>}
 <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(290px,1fr))",gap:18,marginTop:20}}>
 <article style={card}><h2 style={{marginTop:0}}>Submit a concern</h2><form action={raiseConcern}>
 <input type="hidden" name="organization_id" value={org.id}/>
 {isStaff?<><label style={{display:"block",fontSize:12,fontWeight:650}}>Property<select name="property_id" required style={field}>{prop.map((p:any)=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label style={{display:"block",fontSize:12,fontWeight:650}}>Unit (optional)<select name="unit_id" style={field}><option value="">Common area / entire property</option>{unitList.map((u:any)=><option key={u.id} value={u.id}>{names.get(u.property_id)} · {u.unit_number}</option>)}</select></label></>:<><input type="hidden" name="property_id" value={tenantProperty??""}/><input type="hidden" name="unit_id" value={tenantUnit??""}/><p style={{fontSize:12,color:"#718078"}}>Your active tenancy is linked to this concern.</p></>}
 <label style={{display:"block",fontSize:12,fontWeight:650}}>Category<select name="category" style={field}>{["maintenance","payment","safety","noise","neighbour","lease","facilities","other"].map(v=><option key={v} value={v}>{v.replace("_"," ")}</option>)}</select></label>
 <label style={{display:"block",fontSize:12,fontWeight:650}}>Short title<input name="title" required minLength={3} maxLength={160} style={field}/></label>
 <label style={{display:"block",fontSize:12,fontWeight:650}}>Explain the concern<textarea name="description" required minLength={5} maxLength={5000} rows={5} style={{...field,resize:"vertical"}}/></label>
 <label style={{display:"block",fontSize:12,fontWeight:650}}>Priority<select name="priority" style={field}>{["low","normal","high","urgent"].map(v=><option key={v} value={v}>{v}</option>)}</select></label>
 <button style={btn}>Submit concern</button></form></article>
 <article style={card}><h2 style={{marginTop:0}}>What happens next?</h2><ol style={{fontSize:13,lineHeight:2.1,color:"#53665c",paddingLeft:18}}><li>Your concern is saved with its property and unit.</li><li>The landlord or property manager reviews it.</li><li>They update progress and add a response.</li><li>You can return here to check the latest status.</li></ol><p style={{fontSize:11,color:"#718078"}}>For immediate danger or an emergency, contact the appropriate emergency service directly rather than relying on an in-app report.</p></article>
 </div>
 <h2 style={{marginTop:32}}>Concern history</h2>
 <div style={{display:"grid",gap:12}}>{rows.length?rows.map((c:any)=>{const unit=unitList.find((u:any)=>u.id===c.unit_id);return <article key={c.id} style={card}>
 <div style={{display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}><div><b>{c.title}</b><p style={{fontSize:12,color:"#718078",margin:"5px 0"}}>{names.get(c.property_id)??"Property"}{unit?" · Unit "+unit.unit_number:""} · {c.category} · {new Date(c.created_at).toLocaleString("en-KE")}</p></div><span style={{fontSize:11,fontWeight:800,color:c.priority==="urgent"?"#9a382d":"#315e4d"}}>{c.priority.toUpperCase()} · {c.status.replace("_"," ").toUpperCase()}</span></div>
 <p style={{fontSize:13,lineHeight:1.6,whiteSpace:"pre-wrap"}}>{c.description}</p>
 {c.landlord_response&&<div style={{padding:13,borderRadius:9,background:"#edf3ed",marginTop:10}}><b style={{fontSize:12}}>Landlord response</b><p style={{fontSize:13,whiteSpace:"pre-wrap",marginBottom:0}}>{c.landlord_response}</p></div>}
 {isStaff&&<form action={updateConcern} style={{borderTop:"1px solid #e5ece6",paddingTop:12,marginTop:12,display:"grid",gap:8}}><input type="hidden" name="organization_id" value={org.id}/><input type="hidden" name="concern_id" value={c.id}/><label style={{fontSize:12,fontWeight:650}}>Update status<select name="status" defaultValue={c.status} style={field}>{["open","under_review","in_progress","resolved","closed"].map(v=><option key={v} value={v}>{v.replace("_"," ")}</option>)}</select></label><label style={{fontSize:12,fontWeight:650}}>Landlord response<textarea name="landlord_response" defaultValue={c.landlord_response??""} rows={3} maxLength={3000} style={{...field,resize:"vertical"}}/></label><button style={btn}>Save response</button></form>}
 </article>}) : <p style={{color:"#718078"}}>No concerns have been raised yet.</p>}</div>
 </section></main>;
}
