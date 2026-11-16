"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createWorkspace(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2 || name.length > 100) redirect("/dashboard?error=workspace");
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/login");

  const { data: organization, error } = await supabase
    .from("organizations")
    .insert({ name, created_by: userId })
    .select("id")
    .single();
  if (error || !organization) redirect("/dashboard?error=create");

  const { error: memberError } = await supabase.from("organization_members").insert({
    organization_id: organization.id,
    user_id: userId,
    role: "landlord",
  });
  if (memberError) redirect("/dashboard?error=membership");
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
