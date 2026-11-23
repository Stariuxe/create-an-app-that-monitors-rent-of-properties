"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function staffContext() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/login");
  const { data: memberships, error } = await supabase.from("organization_members")
    .select("organization_id,role").eq("user_id", userId)
    .in("role", ["landlord", "property_manager", "accountant"]);
  if (error || !memberships?.length) redirect("/dashboard/wellbeing?error=access");
  return { supabase, userId, memberships };
}

export async function addMaintenanceRequest(formData: FormData) {
  const { supabase, userId, memberships } = await staffContext();
  const organizationId = String(formData.get("organization_id") ?? "");
  const propertyId = String(formData.get("property_id") ?? "");
  const unitId = String(formData.get("unit_id") ?? "") || null;
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priority = String(formData.get("priority") ?? "normal");
  const estimatedRaw = String(formData.get("estimated_cost") ?? "").trim();
  const actualRaw = String(formData.get("actual_cost") ?? "").trim();
  const estimated = estimatedRaw ? Number(estimatedRaw) : null;
  const actual = actualRaw ? Number(actualRaw) : null;
  if (!memberships.some((m) => m.organization_id === organizationId) ||
      !propertyId || title.length < 3 || title.length > 160 || description.length > 3000 ||
      !["low", "normal", "high", "urgent"].includes(priority) ||
      (estimated !== null && (!Number.isFinite(estimated) || estimated < 0)) ||
      (actual !== null && (!Number.isFinite(actual) || actual < 0))) {
    redirect("/dashboard/wellbeing?error=maintenance_validation");
  }
  const { data: property } = await supabase.from("properties").select("id")
    .eq("id", propertyId).eq("organization_id", organizationId).maybeSingle();
  if (!property) redirect("/dashboard/wellbeing?error=access");
  if (unitId) {
    const { data: unit } = await supabase.from("units").select("id")
      .eq("id", unitId).eq("property_id", propertyId).eq("organization_id", organizationId).maybeSingle();
    if (!unit) redirect("/dashboard/wellbeing?error=access");
  }
  const { error } = await supabase.from("maintenance_requests").insert({
    organization_id: organizationId, property_id: propertyId, unit_id: unitId,
    title, description: description || null, priority, status: "open",
    estimated_cost: estimated, actual_cost: actual, amount_paid: 0, payment_status: "unpaid",
  });
  if (error) {
    console.error("Maintenance request insert failed:", error.code);
    redirect("/dashboard/wellbeing?error=maintenance_save");
  }
  revalidatePath("/dashboard/wellbeing");
  revalidatePath("/dashboard/operations");
  redirect("/dashboard/wellbeing?success=maintenance_added");
}

export async function updateMaintenancePayment(formData: FormData) {
  const { supabase, memberships } = await staffContext();
  const organizationId = String(formData.get("organization_id") ?? "");
  const requestId = String(formData.get("request_id") ?? "");
  const amountPaid = Number(formData.get("amount_paid"));
  const actualRaw = String(formData.get("actual_cost") ?? "").trim();
  const actualCost = actualRaw ? Number(actualRaw) : null;
  const reference = String(formData.get("payment_reference") ?? "").trim().slice(0, 100);
  const maintenanceStatus = String(formData.get("maintenance_status") ?? "open");
  if (!memberships.some((m) => m.organization_id === organizationId) ||
      !requestId || !Number.isFinite(amountPaid) || amountPaid < 0 ||
      (actualCost !== null && (!Number.isFinite(actualCost) || actualCost < 0)) ||
      !["open", "in_progress", "on_hold", "completed", "cancelled"].includes(maintenanceStatus)) {
    redirect("/dashboard/wellbeing?error=payment_validation");
  }
  const { data: request } = await supabase.from("maintenance_requests")
    .select("id,actual_cost,estimated_cost").eq("id", requestId)
    .eq("organization_id", organizationId).maybeSingle();
  if (!request) redirect("/dashboard/wellbeing?error=access");
  const finalCost = actualCost ?? (request.actual_cost === null ? request.estimated_cost : Number(request.actual_cost));
  if (finalCost === null || amountPaid > Number(finalCost)) redirect("/dashboard/wellbeing?error=payment_validation");
  const paymentStatus = amountPaid === 0 ? "unpaid" : amountPaid >= Number(finalCost) ? "paid" : "partially_paid";
  const { error } = await supabase.from("maintenance_requests").update({
    actual_cost: finalCost, amount_paid: amountPaid, payment_status: paymentStatus,
    paid_at: paymentStatus === "paid" ? new Date().toISOString() : null,
    payment_reference: reference || null,
    status: maintenanceStatus,
    resolved_at: maintenanceStatus === "completed" ? new Date().toISOString() : null,
  }).eq("id", requestId).eq("organization_id", organizationId);
  if (error) {
    console.error("Maintenance payment update failed:", error.code);
    redirect("/dashboard/wellbeing?error=payment_save");
  }
  revalidatePath("/dashboard/wellbeing");
  revalidatePath("/dashboard/operations");
  redirect("/dashboard/wellbeing?success=payment_updated");
}

export async function saveWellbeingReport(formData: FormData) {
  const { supabase, userId, memberships } = await staffContext();
  const organizationId = String(formData.get("organization_id") ?? "");
  const propertyId = String(formData.get("property_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("report_body") ?? "").trim();
  const start = String(formData.get("period_start") ?? "");
  const end = String(formData.get("period_end") ?? "");
  const recipient = String(formData.get("recipient_email") ?? "").trim().toLowerCase();
  if (!memberships.some((m) => m.organization_id === organizationId) ||
      title.length < 3 || title.length > 160 || body.length > 10000 ||
      !/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end) || end < start ||
      (recipient && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient))) {
    redirect("/dashboard/wellbeing?error=report_validation");
  }
  const { data: property } = await supabase.from("properties").select("id")
    .eq("id", propertyId).eq("organization_id", organizationId).maybeSingle();
  if (!property) redirect("/dashboard/wellbeing?error=access");

  const [{ data: units }, { data: leases }, { data: charges }, { data: maintenance }] = await Promise.all([
    supabase.from("units").select("id,status").eq("organization_id", organizationId).eq("property_id", propertyId),
    supabase.from("leases").select("id,unit_id,monthly_rent,status").eq("organization_id", organizationId).eq("status", "active"),
    supabase.from("rent_charges").select("id,lease_id,amount,amount_paid,due_date").eq("organization_id", organizationId).gte("due_date", start).lte("due_date", end),
    supabase.from("maintenance_requests").select("id,actual_cost,estimated_cost,amount_paid,status").eq("organization_id", organizationId).eq("property_id", propertyId),
  ]);
  const unitList = units ?? [];
  const leaseList = (leases ?? []).filter((l) => unitList.some((u) => u.id === l.unit_id));
  const leaseIds = new Set(leaseList.map((l) => l.id));
  const propertyCharges = (charges ?? []).filter((c) => leaseIds.has(c.lease_id));
  const maintenanceList = maintenance ?? [];
  const expected = leaseList.reduce((sum, l) => sum + Number(l.monthly_rent || 0), 0);
  const charged = propertyCharges.reduce((sum, c) => sum + Number(c.amount || 0), 0);
  const collected = propertyCharges.reduce((sum, c) => sum + Number(c.amount_paid || 0), 0);
  const occupied = unitList.filter((u) => u.status === "occupied").length;
  const metrics = {
    units: unitList.length, occupied, occupancyPercent: unitList.length ? Math.round(occupied / unitList.length * 100) : 0,
    activeLeases: leaseList.length, expectedMonthlyRent: expected, rentCharged: charged, rentCollected: collected,
    arrears: Math.max(0, charged - collected),
    maintenanceItems: maintenanceList.length,
    maintenanceOpen: maintenanceList.filter((m) => !["completed", "cancelled"].includes(m.status)).length,
    maintenanceCost: maintenanceList.reduce((sum, m) => sum + Number(m.actual_cost ?? m.estimated_cost ?? 0), 0),
    maintenancePaid: maintenanceList.reduce((sum, m) => sum + Number(m.amount_paid || 0), 0),
  };
  const { error } = await supabase.from("property_wellbeing_reports").insert({
    organization_id: organizationId, property_id: propertyId, title, report_body: body,
    period_start: start, period_end: end, metrics, recipient_email: recipient || null, created_by: userId,
  });
  if (error) {
    console.error("Wellbeing report save failed:", error.code);
    redirect("/dashboard/wellbeing?error=report_save");
  }
  revalidatePath("/dashboard/wellbeing");
  redirect("/dashboard/wellbeing?success=report_saved");
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
}

export async function sendWellbeingReport(formData: FormData) {
  const { supabase, memberships } = await staffContext();
  const organizationId = String(formData.get("organization_id") ?? "");
  const reportId = String(formData.get("report_id") ?? "");
  const recipient = String(formData.get("recipient_email") ?? "").trim().toLowerCase();
  if (!memberships.some((m) => m.organization_id === organizationId) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
    redirect("/dashboard/wellbeing?error=recipient");
  }
  const { data: report } = await supabase.from("property_wellbeing_reports")
    .select("id,title,report_body,period_start,period_end,metrics,property_id")
    .eq("id", reportId).eq("organization_id", organizationId).maybeSingle();
  if (!report) redirect("/dashboard/wellbeing?error=access");
  const { data: property } = await supabase.from("properties").select("name")
    .eq("id", report.property_id).eq("organization_id", organizationId).maybeSingle();
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) redirect("/dashboard/wellbeing?error=email_config");

  const metrics = report.metrics as Record<string, number>;
  const money = (value: number) => "KES " + Math.round(value || 0).toLocaleString("en-KE");
  const rows = [
    ["Occupancy", (metrics.occupancyPercent ?? 0) + "%"],
    ["Rent collected", money(metrics.rentCollected ?? 0)],
    ["Outstanding rent", money(metrics.arrears ?? 0)],
    ["Maintenance cost", money(metrics.maintenanceCost ?? 0)],
    ["Maintenance paid", money(metrics.maintenancePaid ?? 0)],
    ["Open maintenance items", String(metrics.maintenanceOpen ?? 0)],
  ];
  const meter = (label: string, value: number, max: number, color: string) => {
    const width = max > 0 ? Math.max(0, Math.min(100, value / max * 100)) : 0;
    return `<div style="margin:14px 0"><div style="font-size:13px;margin-bottom:6px"><b>${label}</b><span style="float:right">${Math.round(value).toLocaleString("en-KE")}</span></div><div style="height:10px;background:#e7eee8;border-radius:8px;overflow:hidden"><div style="height:10px;width:${width}%;background:${color};border-radius:8px"></div></div></div>`;
  };
  const charts = `<h2 style="font-size:17px;margin:24px 0 10px">Property wellbeing charts</h2>${meter("Occupancy", metrics.occupancyPercent ?? 0, 100, "#2e7654")}${meter("Rent collected vs charged (KES)", metrics.rentCollected ?? 0, metrics.rentCharged ?? 0, "#568f71")}${meter("Maintenance paid vs cost (KES)", metrics.maintenancePaid ?? 0, metrics.maintenanceCost ?? 0, "#b77a37")}`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:680px;margin:auto;color:#183b32"><h1>${escapeHtml(report.title)}</h1><p><b>${escapeHtml(property?.name ?? "Property")}</b> · ${report.period_start} to ${report.period_end}</p><table style="width:100%;border-collapse:collapse">${rows.map(([k,v]) => `<tr><td style="padding:10px;border-bottom:1px solid #ddd">${k}</td><td style="padding:10px;border-bottom:1px solid #ddd;text-align:right"><b>${v}</b></td></tr>`).join("")}</table>${charts}<h2 style="font-size:17px">Landlord report</h2><p style="white-space:pre-wrap;line-height:1.6">${escapeHtml(report.report_body || "No additional notes.")}</p><p style="color:#738078;font-size:12px">Prepared using records saved in PropertyOS AI · KES</p></div>`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [recipient], subject: report.title, html }),
    cache: "no-store", signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) {
    console.error("Wellbeing report email failed:", response.status);
    redirect("/dashboard/wellbeing?error=email_send");
  }
  const { error } = await supabase.from("property_wellbeing_reports")
    .update({ recipient_email: recipient, sent_at: new Date().toISOString() })
    .eq("id", reportId).eq("organization_id", organizationId);
  if (error) {
    console.error("Wellbeing report sent but sent status could not be saved:", error.code);
    redirect("/dashboard/wellbeing?error=sent_status");
  }
  revalidatePath("/dashboard/wellbeing");
  redirect("/dashboard/wellbeing?success=report_sent");
}
