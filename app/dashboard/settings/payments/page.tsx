import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { savePaymentInstruction } from "./actions";
const card:React.CSSProperties={background:"rgba(255,255,255,.76)",backdropFilter:"blur(18px)",border:"1px solid rgba(255,255,255,.86)",borderRadius:16,padding:20,boxShadow:"0 12px 32px rgba(19,44,42,.07)"};
const field:React.CSSProperties={width:"100%",padding:11,border:"1px solid #cfd9d0",borderRadius:7,marginTop:6,marginBottom:12,background:"#fff",color:"#132c2a"};
const btn:React.CSSProperties={padding:"11px 15px",border:0,borderRadius:7,background:"#183b32",color:"#fff",fontWeight:700};
export default async function PaymentInstructionsPage({searchParams}:{searchParams:Promise<{error?:string;success?:string}>}) {
 const params=await searchParams; const supabase=await createClient();
 const {data:claims}=await supabase.auth.getClaims(); const uid=claims?.claims?.sub;
 if(!uid) redirect("/login?next=%2Fdashboard%2Fsettings%2Fpayments");
 const {data:members}=await supabase.from("organization_members").select("organization_id,role,organizations(id,name)").eq("user_id",uid).in("role",["landlord","property_manager","accountant"]);
 const member=members?.[0]; const org=member?(Array.isArray(member.organizations)?member.organizations[0]:member.organizations):null;
 if(!org) return <main style={{padding:30}}>No landlord workspace found. <a href="/dashboard/operations">Return to workspace</a></main>;
 const {data:instructions}=await supabase.from("property_payment_instructions").select("*").eq("organization_id",org.id).order("created_at",{ascending:false});
 const errors:Record<string,string>={access:"You do not have permission to change payment details.",validation:"Check the payment method and instruction name.",save:"Payment instructions could not be saved."};
 const methods=["mpesa","bank","cash","card","check","other"];
 const moneyLabels:Record<string,string>={mpesa:"M-Pesa",bank:"Bank transfer",cash:"Cash",card:"Card",check:"Cheque",other:"Other"};
 const input=(name:string,label:string,type="text")=><label style={{display:"block",fontSize:12,fontWeight:650}}>{label}<input name={name} type={type} style={field}/></label>;
 return <main style={{minHeight:"100vh",padding:"28px 5%",color:"#183b32",background:"linear-gradient(135deg,#f3f5ef,#e9eee8 55%,#f4f3ed)"}}><section style={{maxWidth:1100,margin:"18px auto"}}>
 <a href="/dashboard/operations" style={{fontWeight:700,color:"#315e4d"}}>← Back to workspace</a>
 <p style={{fontSize:11,letterSpacing:2,color:"#6d9e8b",marginTop:24}}>PAYMENT SETTINGS · {org.name}</p><h1 style={{fontSize:34,margin:"8px 0"}}>Where tenants should pay</h1>
 <p style={{color:"#687573",lineHeight:1.6}}>Save the official payment channels and instructions tenants should use. Only active instructions are shown to signed-in tenants with an active lease.</p>
 {params.error&&<p role="alert" style={{background:"#f9e8e2",padding:12,borderRadius:8,color:"#8a3829"}}>{errors[params.error]??"Something went wrong."}</p>}
 {params.success&&<p role="status" style={{background:"#e5f1e9",padding:12,borderRadius:8,color:"#245a3e"}}>Payment instructions saved.</p>}
 <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(290px,1fr))",gap:18,marginTop:20}}>
 <article style={card}><h2 style={{marginTop:0}}>Add payment destination</h2><form action={savePaymentInstruction}>
 <input type="hidden" name="organization_id" value={org.id}/>
 <label style={{display:"block",fontSize:12,fontWeight:650}}>Payment method<select name="method" required style={field}>{methods.map(m=><option value={m} key={m}>{moneyLabels[m]}</option>)}</select></label>
 {input("label","Display name (e.g. Main rent account)")}
 {input("beneficiary_name","Beneficiary / account holder")}
 {input("bank_name","Bank name")}
 {input("branch_name","Branch")}
 {input("account_name","Account name")}
 {input("account_number","Account number")}
 {input("paybill_number","M-Pesa Paybill number")}
 {input("till_number","M-Pesa Till number")}
 {input("phone_number","M-Pesa phone number")}
 {input("account_reference","Tenant account reference")}
 <label style={{display:"block",fontSize:12,fontWeight:650}}>Instructions<textarea name="instructions" rows={4} maxLength={1500} placeholder="Explain how the tenant should pay and what reference to use." style={{...field,resize:"vertical"}}/></label>
 <label style={{display:"flex",gap:9,alignItems:"center",fontSize:13,marginBottom:14}}><input type="checkbox" name="is_active" defaultChecked/> Show this payment method to tenants</label>
 <button style={btn}>Save payment instructions</button>
 </form></article>
 <article style={card}><h2 style={{marginTop:0}}>Saved payment destinations</h2>{instructions?.length?instructions.map((item:any)=><div key={item.id} style={{padding:"13px 0",borderBottom:"1px solid #e5ece6"}}>
 <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center"}}><b>{item.label}</b><span style={{fontSize:11,fontWeight:800,color:item.is_active?"#256344":"#8b692e"}}>{item.is_active?"ACTIVE":"HIDDEN"}</span></div>
 <p style={{fontSize:12,color:"#718078",margin:"6px 0"}}>{moneyLabels[item.method]??item.method} · {item.beneficiary_name??item.account_name??"No beneficiary entered"}</p>
 {item.bank_name&&<p style={{fontSize:12,margin:"4px 0"}}>{item.bank_name}{item.branch_name?" · "+item.branch_name:""}</p>}
 {item.account_number&&<p style={{fontSize:12,margin:"4px 0"}}>Account: {item.account_number}</p>}
 {item.paybill_number&&<p style={{fontSize:12,margin:"4px 0"}}>Paybill: {item.paybill_number}</p>}
 {item.till_number&&<p style={{fontSize:12,margin:"4px 0"}}>Till: {item.till_number}</p>}
 {item.phone_number&&<p style={{fontSize:12,margin:"4px 0"}}>Phone: {item.phone_number}</p>}
 {item.account_reference&&<p style={{fontSize:12,margin:"4px 0"}}>Reference: {item.account_reference}</p>}
 {item.instructions&&<p style={{fontSize:12,color:"#53665c",whiteSpace:"pre-wrap"}}>{item.instructions}</p>}
 <details style={{marginTop:10}}><summary style={{cursor:"pointer",fontSize:12,fontWeight:700}}>Edit this destination</summary><form action={savePaymentInstruction} style={{marginTop:12}}>
 <input type="hidden" name="organization_id" value={org.id}/><input type="hidden" name="id" value={item.id}/>
 <label style={{display:"block",fontSize:12,fontWeight:650}}>Method<select name="method" defaultValue={item.method} style={field}>{methods.map(m=><option value={m} key={m}>{moneyLabels[m]}</option>)}</select></label>
 <label style={{display:"block",fontSize:12,fontWeight:650}}>Display name<input name="label" defaultValue={item.label} required style={field}/></label>
 <label style={{display:"block",fontSize:12,fontWeight:650}}>Beneficiary<input name="beneficiary_name" defaultValue={item.beneficiary_name??""} style={field}/></label>
 <label style={{display:"block",fontSize:12,fontWeight:650}}>Bank<input name="bank_name" defaultValue={item.bank_name??""} style={field}/></label>
 <label style={{display:"block",fontSize:12,fontWeight:650}}>Branch<input name="branch_name" defaultValue={item.branch_name??""} style={field}/></label>
 <label style={{display:"block",fontSize:12,fontWeight:650}}>Account name<input name="account_name" defaultValue={item.account_name??""} style={field}/></label>
 <label style={{display:"block",fontSize:12,fontWeight:650}}>Account number<input name="account_number" defaultValue={item.account_number??""} style={field}/></label>
 <label style={{display:"block",fontSize:12,fontWeight:650}}>Paybill<input name="paybill_number" defaultValue={item.paybill_number??""} style={field}/></label>
 <label style={{display:"block",fontSize:12,fontWeight:650}}>Till<input name="till_number" defaultValue={item.till_number??""} style={field}/></label>
 <label style={{display:"block",fontSize:12,fontWeight:650}}>Phone<input name="phone_number" defaultValue={item.phone_number??""} style={field}/></label>
 <label style={{display:"block",fontSize:12,fontWeight:650}}>Reference<input name="account_reference" defaultValue={item.account_reference??""} style={field}/></label>
 <label style={{display:"block",fontSize:12,fontWeight:650}}>Instructions<textarea name="instructions" defaultValue={item.instructions??""} rows={3} style={field}/></label>
 <label style={{display:"flex",gap:9,alignItems:"center",fontSize:12,marginBottom:12}}><input type="checkbox" name="is_active" defaultChecked={item.is_active}/> Show to tenants</label>
 <button style={btn}>Update destination</button></form></details>
 </div>):<p style={{fontSize:13,color:"#718078"}}>No payment destinations saved yet.</p>}</article>
 </div></section></main>;
}
