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
    const { error } = await supabase.from("payments")
      .update({ status: "failed", notes: "Daraja sandbox payment was not completed." })
      .eq("id", payment.id).eq("status", "pending");
    if (error) return NextResponse.json({ error: "Could not record payment result" }, { status: 500 });
    return NextResponse.json({ received: true, successful: false });
  }
  const items = callback.CallbackMetadata?.Item ?? [];
  const value = (name: string) => items.find((item) => item.Name === name)?.Value;
  const receipt = value("MpesaReceiptNumber");
  const paidAmount = Number(value("Amount"));
  if (typeof receipt !== "string" || !receipt || !Number.isFinite(paidAmount)) {
    return NextResponse.json({ error: "Payment confirmation metadata is incomplete" }, { status: 422 });
  }
  const { data: outcome, error: confirmError } = await supabase.rpc("confirm_mpesa_sandbox_payment", {
    p_checkout_id: checkoutId,
    p_receipt: receipt,
    p_paid_amount: paidAmount,
  });
  if (confirmError) return NextResponse.json({ error: "Could not safely reconcile payment" }, { status: 500 });
  if (outcome === "invalid_receipt") return NextResponse.json({ received: true, successful: false, reason: "invalid_receipt" }, { status: 422 });
  if (outcome === "receipt_conflict") return NextResponse.json({ received: true, successful: false, needs_review: true, reason: "receipt_already_used" });
  if (outcome === "unmatched") return NextResponse.json({ received: true, matched: false });
  if (outcome === "duplicate") return NextResponse.json({ received: true, duplicate: true });
  if (outcome === "confirmed_with_credit") return NextResponse.json({ received: true, successful: true, credit_created: true });
  if (outcome === "confirmed") return NextResponse.json({ received: true, successful: true });
  return NextResponse.json({ error: "Unexpected payment reconciliation result" }, { status: 500 });
}
