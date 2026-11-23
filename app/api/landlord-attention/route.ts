import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: memberships, error: membershipError } = await supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", userId)
    .eq("role", "landlord");
  if (membershipError) return NextResponse.json({ error: "membership_check_failed" }, { status: 503 });
  const organizationIds = (memberships ?? []).map((item) => item.organization_id);
  if (!organizationIds.length) return NextResponse.json({ items: [] });

  const today = new Date().toISOString().slice(0, 10);
  const [chargesResult, repairsResult] = await Promise.all([
    supabase.from("rent_charges")
      .select("id,due_date,amount,amount_paid,billing_period")
      .in("organization_id", organizationIds)
      .in("status", ["unpaid", "partially_paid"])
      .lt("due_date", today)
      .order("due_date", { ascending: true })
      .limit(30),
    supabase.from("maintenance_requests")
      .select("id,title,priority,status,property_id,unit_id")
      .in("organization_id", organizationIds)
      .in("priority", ["high", "urgent"])
      .not("status", "in", "(completed,cancelled)")
      .order("created_at", { ascending: false })
      .limit(30),
  ]);
  if (chargesResult.error || repairsResult.error) {
    return NextResponse.json({ error: "attention_lookup_failed" }, { status: 503 });
  }

  const items = [
    ...(chargesResult.data ?? []).map((charge) => ({
      id: "rent-" + charge.id,
      type: "overdue_rent",
      title: "Overdue rent needs attention",
      body: "A rent charge due " + charge.due_date + " has an outstanding balance of KES " +
        Math.max(0, Number(charge.amount) - Number(charge.amount_paid ?? 0)).toLocaleString("en-KE") + ".",
      href: "/dashboard/operations#recent-charges",
    })),
    ...(repairsResult.data ?? []).map((repair) => ({
      id: "repair-" + repair.id,
      type: "urgent_maintenance",
      title: repair.priority === "urgent" ? "Urgent maintenance needs attention" : "High-priority maintenance needs attention",
      body: repair.title + " · " + repair.status.replaceAll("_", " "),
      href: "/dashboard/wellbeing",
    })),
  ];
  return NextResponse.json({ items }, {
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  });
}
