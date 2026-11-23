import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  const input = body as { documentType?: string; documentNumber?: string; consent?: boolean };
  if (input.consent !== true || !["national_id", "passport"].includes(input.documentType || "") ||
      typeof input.documentNumber !== "string" || input.documentNumber.trim().length < 3 || input.documentNumber.trim().length > 64) {
    return NextResponse.json({ error: "Provide a valid document type, number and explicit consent." }, { status: 400 });
  }

  const secret = process.env.KORAPAY_SECRET_KEY;
  if (!secret) return NextResponse.json({ error: "Kora identity verification is not activated yet. Add KORAPAY_SECRET_KEY after enabling Identity on your Kora account." }, { status: 503 });

  const endpoint = input.documentType === "national_id"
    ? "https://api.korapay.com/merchant/api/v1/identities/ke/national-id"
    : "https://api.korapay.com/merchant/api/v1/identities/ke/passport";
  let providerResponse: Response;
  try {
    providerResponse = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: "Bearer " + secret, "Content-Type": "application/json" },
      body: JSON.stringify({ id: input.documentNumber.trim(), verification_consent: true }),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ error: "The identity provider could not be reached. Please try again later." }, { status: 502 });
  }
  const result = await providerResponse.json().catch(() => null) as { status?: boolean; message?: string; data?: { reference?: string; status?: string } } | null;
  if (!providerResponse.ok || !result?.status || !result.data?.reference) {
    return NextResponse.json({ error: "The identity provider did not accept the request. Check your provider access and try again." }, { status: 502 });
  }

  const { error: saveError } = await supabase.from("identity_verification_requests").insert({
    user_id: auth.user.id,
    method: "korapay",
    document_type: input.documentType,
    provider_reference: result.data.reference,
    status: "pending",
  });
  if (saveError) {
    console.error("Could not save Kora identity reference:", saveError.code);
    return NextResponse.json({ error: "The provider started the check, but PropertyOS could not save its reference. Contact support with the provider reference: " + result.data.reference }, { status: 500 });
  }
  return NextResponse.json({ accepted: true, status: result.data.status || "processing" });
}
