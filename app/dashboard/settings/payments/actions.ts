"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function staff() {
 const supabase=await createClient();
 const {data:claims}=await supabase.auth.getClaims();
 const userId=claims?.claims?.sub;
 if(!userId) redirect("/login");
 const {data:members,error}=await supabase.from("organization_members").select("organization_id,role").eq("user_id",userId).in("role",["landlord","property_manager","accountant"]);
 if(error||!members?.length) redirect("/dashboard/operations?error=access");
 return {supabase,userId,members};
}
export async function savePaymentInstruction(f:FormData) {
 const {supabase,userId,members}=await staff();
 const org=String(f.get("organization_id")??"");
 if(!members.some(m=>m.organization_id===org)) redirect("/dashboard/settings/payments?error=access");
 const id=String(f.get("id")??"").trim();
 const method=String(f.get("method")??"");
 const label=String(f.get("label")??"").trim();
 const fields=["beneficiary_name","bank_name","branch_name","account_name","account_number","paybill_number","till_number","phone_number","account_reference","instructions"] as const;
 const payload:Record<string,unknown>={organization_id:org,method,label,is_active:f.get("is_active")==="on",updated_at:new Date().toISOString()};
 for(const key of fields) payload[key]=String(f.get(key)??"").trim()||null;
 if(!["mpesa","bank","cash","card","check","other"].includes(method)||label.length<2||label.length>100) redirect("/dashboard/settings/payments?error=validation");
 if(id) {
  const {error}=await supabase.from("property_payment_instructions").update(payload).eq("id",id).eq("organization_id",org);
  if(error) redirect("/dashboard/settings/payments?error=save");
 } else {
  const {error}=await supabase.from("property_payment_instructions").insert({...payload,created_by:userId});
  if(error) redirect("/dashboard/settings/payments?error=save");
 }
 revalidatePath("/dashboard/settings/payments");
 revalidatePath("/dashboard/concerns");
 redirect("/dashboard/settings/payments?success=saved");
}
export async function recordRentPayment(f:FormData) {
 const {supabase,members}=await staff();
 const org=String(f.get("organization_id")??"");
 const charge=String(f.get("rent_charge_id")??"");
 const method=String(f.get("method")??"");
 const amount=Number(f.get("amount"));
 const reference=String(f.get("reference")??"").trim();
 const received=String(f.get("received_from")??"").trim();
 const notes=String(f.get("notes")??"").trim();
 const paidAt=String(f.get("paid_at")??"");
 if(!members.some(m=>m.organization_id===org)||!charge||!["bank","cash","card","check","other"].includes(method)||!Number.isFinite(amount)||amount<=0||(paidAt&&!/^\\d{4}-\\d{2}-\\d{2}$/.test(paidAt))) redirect("/dashboard/operations?error=payment_validation");
 const paidIso=paidAt?new Date(paidAt+"T12:00:00+03:00").toISOString():new Date().toISOString();
 const {error}=await supabase.rpc("record_manual_rent_payment",{p_organization_id:org,p_rent_charge_id:charge,p_amount:amount,p_method:method,p_reference:reference||null,p_received_from:received||null,p_notes:notes||null,p_paid_at:paidIso});
 if(error) {
  console.error("Manual rent payment failed:",error.code);
  redirect(error.code==="23505"?"/dashboard/operations?error=payment_duplicate":"/dashboard/operations?error=payment_save");
 }
 revalidatePath("/dashboard/operations");
 revalidatePath("/dashboard/portfolio");
 revalidatePath("/dashboard/wellbeing");
 revalidatePath("/dashboard/logs/payments");
 revalidatePath("/dashboard/logs/rent");
 redirect("/dashboard/operations?success=payment_recorded");
}
