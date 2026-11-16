"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function workspace(formData: FormData) {
  const organization_id = String(formData.get("organization_id") ?? "");
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/login");
  const { data: member } = await supabase.from("organization_members").select("organization_id,role").eq("organization_id", organization_id).eq("user_id", userId).in("role", ["landlord","property_manager","accountant","caretaker"]).maybeSingle();
  if (!member) redirect("/dashboard/operations?error=access");
  return { supabase, organization_id };
}
export async function addProperty(f: FormData) {
  const {supabase,organization_id}=await workspace(f);
  const name=String(f.get("name")??"").trim();
  const property_type=String(f.get("property_type")??"residential");
  if(name.length<2 || !["residential","commercial","mixed_use","other"].includes(property_type)) redirect("/dashboard/operations?error=property");
  const {error}=await supabase.from("properties").insert({organization_id,name,property_type,address:String(f.get("address")??"").trim()||null,county:String(f.get("county")??"").trim()||null});
  redirect(error?"/dashboard/operations?error=property":"/dashboard/operations?success=property");
}
export async function addUnit(f: FormData) {
  const {supabase,organization_id}=await workspace(f);
  const property_id=String(f.get("property_id")??""); const unit_number=String(f.get("unit_number")??"").trim(); const monthly_rent=Number(f.get("monthly_rent"));
  if(!property_id||!unit_number||!Number.isFinite(monthly_rent)||monthly_rent<0) redirect("/dashboard/operations?error=unit");
  const {error}=await supabase.from("units").insert({organization_id,property_id,unit_number,monthly_rent,currency:"KES",status:"vacant"});
  redirect(error?"/dashboard/operations?error=unit":"/dashboard/operations?success=unit");
}
export async function addTenant(f: FormData) {
  const {supabase,organization_id}=await workspace(f);
  const full_name=String(f.get("full_name")??"").trim(); if(full_name.length<2) redirect("/dashboard/operations?error=tenant");
  const {error}=await supabase.from("tenants").insert({organization_id,full_name,email:String(f.get("email")??"").trim().toLowerCase()||null,phone:String(f.get("phone")??"").trim()||null});
  redirect(error?"/dashboard/operations?error=tenant":"/dashboard/operations?success=tenant");
}
export async function addLease(f: FormData) {
  const {supabase,organization_id}=await workspace(f);
  const unit_id=String(f.get("unit_id")??""); const tenant_id=String(f.get("tenant_id")??""); const start_date=String(f.get("start_date")??""); const monthly_rent=Number(f.get("monthly_rent")); const rent_due_day=Number(f.get("rent_due_day")??1);
  if(!unit_id||!tenant_id||!start_date||!Number.isFinite(monthly_rent)||monthly_rent<0||rent_due_day<1||rent_due_day>28) redirect("/dashboard/operations?error=lease");
  const {error}=await supabase.from("leases").insert({organization_id,unit_id,tenant_id,start_date,monthly_rent,rent_due_day,status:"active"});
  redirect(error?"/dashboard/operations?error=lease":"/dashboard/operations?success=lease");
}
export async function addRentCharge(f: FormData) {
  const {supabase,organization_id}=await workspace(f);
  const lease_id=String(f.get("lease_id")??""); const billing_period=String(f.get("billing_period")??""); const due_date=String(f.get("due_date")??""); const amount=Number(f.get("amount"));
  if(!lease_id||!billing_period||!due_date||!Number.isFinite(amount)||amount<=0) redirect("/dashboard/operations?error=charge");
  const {error}=await supabase.from("rent_charges").insert({organization_id,lease_id,billing_period:billing_period+"-01",due_date,amount,amount_paid:0,status:"unpaid"});
  redirect(error?"/dashboard/operations?error=charge":"/dashboard/operations?success=charge");
}
