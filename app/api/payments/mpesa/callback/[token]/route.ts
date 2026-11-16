import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";

function authorizedToken(received: string, expected: string) {
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

type CallbackItem = { Name?: string; Value?: string | number };
type DarajaCallback = {
  Body?: {
    stkCallback?: {
      CheckoutRequestID?: string;
      ResultCode?: number;
      ResultDesc?: string;
      CallbackMetadata?: { Item?: CallbackItem[] };
    };
  };
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const expected = process.env.MPESA_CALLBACK_TOKEN;
  if (!expected || !authorizedToken(token, expected)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !secretKey) {
    return NextResponse.json({ error: "Payment callback is not configured" }, { status: 503 });
  }

  let payload: DarajaCallback;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid callback payload" }, { status: 400 });
  }

  const callback = payload.Body?.stkCallback;
  const checkoutId = callback?.CheckoutRequestID;
  if (!checkoutId || typeof callback?.ResultCode !== "number") {
    return NextResponse.json({ error: "Missing checkout result" }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: payment, error: lookupError } = await supabase
    .from("payments")
    .select("id, organization_id, rent_charge_id, amount, status")
    .eq("provider_checkout_id", checkoutId)
    .eq("method", "mpesa")
    .maybeSingle();

  if (lookupError) return NextResponse.json({ error: "Could not verify payment" }, { status: 500 });
  if (!payment) return NextResponse.json({ received: true, matched: false });

  if (payment.status !== "pending") {
    return NextResponse.json({ received: true, duplicate: true });
  }

  if (callback.ResultCode !== 0) {
    const { error } = await supabase
      .from("payments")
      .update({ status: "failed", notes: "Daraja sandbox payment was not completed." })
      .eq("id", payment.id)
      .eq("status", "pending");
    if (error) return NextResponse.json({ error: "Could not record payment result" }, { status: 500 });
    return NextResponse.json({ received: true, successful: false });
  }

  const items = callback.CallbackMetadata?.Item ?? [];
  const value = (name: string) => items.find((item) => item.Name === name)?.Value;
  const receipt = value("MpesaReceiptNumber");
  const paidAmount = Number(value("Amount"));
  const phone = value("PhoneNumber");
  if (
    typeof receipt !== "string" ||
    !receipt ||
    !Number.isFinite(paidAmount) ||
    paidAmount !== Number(payment.amount)
  ) {
    return NextResponse.json({ error: "Payment confirmation did not match expected amount" }, { status: 422 });
  }

  const { data: confirmed, error: confirmError } = await supabase
    .from("payments")
    .update({
      status: "confirmed",
      provider_reference: receipt,
      paid_at: new Date().toISOString(),
      notes: typeof phone === "number" ? "Daraja sandbox callback verified." : "Daraja sandbox callback verified.",
    })
    .eq("id", payment.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (confirmError) return NextResponse.json({ error: "Could not confirm payment" }, { status: 500 });
  if (!confirmed) return NextResponse.json({ received: true, duplicate: true });

  const { data: charge, error: chargeError } = await supabase
    .from("rent_charges")
    .select("amount, amount_paid")
    .eq("id", payment.rent_charge_id)
    .eq("organization_id", payment.organization_id)
    .single();
  if (chargeError || !charge) {
    return NextResponse.json({ error: "Payment confirmed; rent balance needs reconciliation" }, { status: 500 });
  }

  const newAmountPaid = Number(charge.amount_paid) + paidAmount;
  const newStatus = newAmountPaid >= Number(charge.amount) ? "paid" : "partially_paid";
  const { error: chargeUpdateError } = await supabase
    .from("rent_charges")
    .update({ amount_paid: newAmountPaid, status: newStatus })
    .eq("id", payment.rent_charge_id)
    .eq("organization_id", payment.organization_id);

  if (chargeUpdateError) {
    return NextResponse.json({ error: "Payment confirmed; rent balance needs reconciliation" }, { status: 500 });
  }

  return NextResponse.json({ received: true, successful: true });
}
