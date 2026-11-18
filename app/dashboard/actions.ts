"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createWorkspace(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2 || name.length > 100) redirect("/dashboard?error=workspace");

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect("/login");

  const { data: organizationId, error } = await supabase.rpc(
    "create_workspace_for_current_user",
    { p_name: name }
  );

  if (error || !organizationId) {
    // Keep the browser message safe while retaining a useful server-side diagnostic.
    console.error("PropertyOS workspace creation failed:", error?.code ?? "empty_result");
    const code = error?.code === "28000" ? "auth"
      : error?.code === "22023" ? "workspace"
      : error?.code === "42501" ? "permission"
      : "create";
    redirect(`/dashboard?error=${code}`);
  }

  redirect("/dashboard/operations");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
