"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const allowedTypes = ["expense", "maintenance", "compliance", "mortgage", "valuation", "other_income"] as const;
const allowedStatuses = ["recorded", "planned", "in_progress", "completed", "paid", "overdue"] as const;

export async function addPortfolioRecord(formData: FormData) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/login?next=%2Fdashboard%2Fportfolio");

  const organizationId = String(formData.get("organization_id") ?? "").trim();
  const propertyId = String(formData.get("property_id") ?? "").trim();
  const recordType = String(formData.get("record_type") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const amountText = String(formData.get("amount") ?? "").trim();
  const recordDate = String(formData.get("record_date") ?? "");
  const dueDate = String(formData.get("due_date") ?? "").trim();
  const status = String(formData.get("status") ?? "recorded");
  const notes = String(formData.get("notes") ?? "").trim();

  if (!organizationId || !propertyId || !allowedTypes.includes(recordType as typeof allowedTypes[number])
    || !allowedStatuses.includes(status as typeof allowedStatuses[number])
    || title.length < 2 || title.length > 140 || notes.length > 2000
    || !/^\d{4}-\d{2}-\d{2}$/.test(recordDate)
    || (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate))) {
    redirect("/dashboard/portfolio?error=validation");
  }

  const amount = amountText ? Number(amountText) : null;
  if (amountText && (!Number.isFinite(amount) || amount! < 0 || amount! > 999999999999)) {
    redirect("/dashboard/portfolio?error=validation");
  }

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id,role")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .in("role", ["landlord", "property_manager", "accountant"])
    .maybeSingle();
  if (!membership) redirect("/dashboard/portfolio?error=access");

  const { data: property } = await supabase
    .from("properties")
    .select("id")
    .eq("id", propertyId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (!property) redirect("/dashboard/portfolio?error=property");

  const { error } = await supabase.from("property_portfolio_records").insert({
    organization_id: organizationId,
    property_id: propertyId,
    record_type: recordType,
    title,
    amount,
    record_date: recordDate,
    due_date: dueDate || null,
    status,
    notes: notes || null,
    created_by: userId,
  });
  if (error) {
    console.error("PropertyOS portfolio record insert failed:", error.code);
    redirect("/dashboard/portfolio?error=save");
  }

  revalidatePath("/dashboard/portfolio");
  revalidatePath("/dashboard/operations");
  redirect("/dashboard/portfolio?saved=1");
}
