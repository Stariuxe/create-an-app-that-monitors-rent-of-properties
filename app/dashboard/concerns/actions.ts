"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
export async function raiseConcern(f:FormData) {
 const supabase=await createClient(); const {data:claims}=await supabase.auth.getClaims(); const uid=claims?.claims?.sub;
 if(!uid) redirect("/login");
 const org=String(f.get("organization_id")??""); const propertyId=String(f.get("property_id")??"");
 const unitId=String(f.get("unit_id")??"")||null; const category=String(f.get("category")??"other");
 const title=String(f.get("title")??"").trim(); const description=String(f.get("description")??"").trim();
 const priority=String(f.get("priority")??"normal");
 if(title.length<3||title.length>160||description.length<5||description.length>5000||!["maintenance","payment","safety","noise","neighbour","lease","facilities","other"].includes(category)||!["low","normal","high","urgent"].includes(priority)) redirect("/dashboard/concerns?error=validation");
 const {data:members}=await supabase.from("organization_members").select("organization_id,role").eq("user_id",uid).in("role",["landlord","property_manager","accountant"]);
 const staff=members?.some(m=>m.organization_id===org);
 let tenantId:string|null=null; let property=propertyId; let unit=unitId;
 if(!staff) {
  const {data:tenant}=await supabase.from("tenants").select("id,organization_id").eq("auth_user_id",uid).eq("organization_id",org).maybeSingle();
  if(!tenant) redirect("/dashboard/concerns?error=access");
  const {data:lease}=await supabase.from("leases").select("unit_id,units(property_id)").eq("tenant_id",tenant.id).eq("organization_id",org).eq("status","active").maybeSingle();
  const leaseUnit=lease?(Array.isArray(lease.units)?lease.units[0]:lease.units):null;
  if(!lease||!leaseUnit) redirect("/dashboard/concerns?error=access");
  tenantId=tenant.id; unit=lease.unit_id; property=(leaseUnit as {property_id:string}).property_id;
 }
 const {data:propertyRow}=await supabase.from("properties").select("id").eq("id",property).eq("organization_id",org).maybeSingle();
 if(!propertyRow) redirect("/dashboard/concerns?error=access");
 if(unit) {const {data:unitRow}=await supabase.from("units").select("id").eq("id",unit).eq("property_id",property).eq("organization_id",org).maybeSingle();if(!unitRow) redirect("/dashboard/concerns?error=access");}
 const {error}=await supabase.from("property_concerns").insert({organization_id:org,property_id:property,unit_id:unit,tenant_id:tenantId,created_by:uid,category,title,description,priority,status:"open"});
 if(error){console.error("Concern creation failed:",error.code);redirect("/dashboard/concerns?error=save");}
 revalidatePath("/dashboard/concerns"); revalidatePath("/dashboard/logs/concerns");
 redirect("/dashboard/concerns?success=created");
}
export async function updateConcern(f:FormData) {
 const supabase=await createClient(); const {data:claims}=await supabase.auth.getClaims(); const uid=claims?.claims?.sub;
 if(!uid) redirect("/login");
 const org=String(f.get("organization_id")??""); const id=String(f.get("concern_id")??"");
 const status=String(f.get("status")??"open"); const response=String(f.get("landlord_response")??"").trim();
 const {data:member}=await supabase.from("organization_members").select("role").eq("user_id",uid).eq("organization_id",org).in("role",["landlord","property_manager","accountant"]).maybeSingle();
 if(!member||!id||!["open","under_review","in_progress","resolved","closed"].includes(status)||response.length>3000) redirect("/dashboard/concerns?error=access");
 const {error}=await supabase.from("property_concerns").update({status,landlord_response:response||null,responded_by:uid,responded_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("id",id).eq("organization_id",org);
 if(error) redirect("/dashboard/concerns?error=save");
 revalidatePath("/dashboard/concerns"); revalidatePath("/dashboard/logs/concerns");
 redirect("/dashboard/concerns?success=updated");
}
