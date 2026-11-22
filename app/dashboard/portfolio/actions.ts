"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const allowedTypes = ["expense", "maintenance", "compliance", "mortgage", "valuation", "other_income"] as const;
const allowedStatuses = ["recorded", "planned", "in_progress", "completed", "paid", "overdue"] as const;

async function access(propertyId: string) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/login");
  const { data: memberships, error } = await supabase.from("organization_members")
    .select("organization_id,role").eq("user_id", userId)
    .in("role", ["landlord", "property_manager", "accountant"]);
  if (error || !memberships?.length) redirect("/dashboard/portfolio?error=access");
  const { data: property } = await supabase.from("properties").select("id,organization_id")
    .eq("id", propertyId).in("organization_id", memberships.map((m) => m.organization_id)).maybeSingle();
  if (!property) redirect("/dashboard/portfolio?error=access");
  return { supabase, userId, organizationId: property.organization_id };
}

export async function addPortfolioRecord(formData: FormData) {
  const propertyId = String(formData.get("property_id") ?? "");
  const type = String(formData.get("record_type") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const amountRaw = String(formData.get("amount") ?? "").trim();
  const date = String(formData.get("record_date") ?? "");
  const dueDate = String(formData.get("due_date") ?? "");
  const status = String(formData.get("status") ?? "recorded");
  const notes = String(formData.get("notes") ?? "").trim();
  if (!propertyId || !(allowedTypes as readonly string[]).includes(type) ||
      title.length < 2 || title.length > 140 ||
      (amountRaw && (!Number.isFinite(Number(amountRaw)) || Number(amountRaw) < 0)) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !(allowedStatuses as readonly string[]).includes(status) || notes.length > 2000) {
    redirect("/dashboard/portfolio?error=validation");
  }
  const { supabase, userId, organizationId } = await access(propertyId);
  const { error } = await supabase.from("property_portfolio_records").insert({
    organization_id: organizationId, property_id: propertyId, record_type: type,
    title, amount: amountRaw ? Number(amountRaw) : null, record_date: date,
    due_date: dueDate || null, status, notes: notes || null, created_by: userId,
  });
  if (error) {
    console.error("Portfolio record insert failed:", error.code);
    redirect("/dashboard/portfolio?error=save");
  }
  revalidatePath("/dashboard/portfolio");
  redirect("/dashboard/portfolio?success=saved");
}

export async function updatePortfolioRecordStatus(formData: FormData) {
  const recordId = String(formData.get("record_id") ?? "");
  const propertyId = String(formData.get("property_id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!recordId || !propertyId || !(allowedStatuses as readonly string[]).includes(status)) {
    redirect("/dashboard/portfolio?error=validation");
  }
  const { supabase, organizationId } = await access(propertyId);
  const { error } = await supabase.from("property_portfolio_records").update({ status })
    .eq("id", recordId).eq("property_id", propertyId).eq("organization_id", organizationId);
  if (error) {
    console.error("Portfolio record update failed:", error.code);
    redirect("/dashboard/portfolio?error=save");
  }
  revalidatePath("/dashboard/portfolio");
  redirect("/dashboard/portfolio?success=updated");
}
