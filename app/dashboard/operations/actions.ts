"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function workspace(formData: FormData) {
  const requestedOrganizationId = String(formData.get("organization_id") ?? "").trim();
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/login");

  // Resolve access from the authenticated user's own memberships first.
  // The hidden form field is only a selector, never proof of authorization.
  const { data: memberships, error } = await supabase
    .from("organization_members")
    .select("organization_id,role")
    .eq("user_id", userId)
    .in("role", ["landlord","property_manager","accountant","caretaker","platform_admin"]);

  if (error || !memberships?.length) redirect("/dashboard/operations?error=access");
  const member = memberships.find((item) => item.organization_id === requestedOrganizationId)
    ?? (memberships.length === 1 ? memberships[0] : null);
  if (!member) redirect("/dashboard/operations?error=access");

  return { supabase, organization_id: member.organization_id };
}
export async function addProperty(f: FormData) {
  const {supabase,organization_id}=await workspace(f);
  const name=String(f.get("name")??"").trim();
  const property_type=String(f.get("property_type")??"residential");
  if(name.length<2 || !["residential","commercial","mixed_use","other"].includes(property_type)) redirect("/dashboard/operations?error=property");
  const {error}=await supabase.from("properties").insert({organization_id,name,property_type,address:String(f.get("address")??"").trim()||null,county:String(f.get("county")??"").trim()||null});
  if (error) { console.error("PropertyOS addProperty failed:", error.code); redirect("/dashboard/operations?error=property"); }
  revalidatePath("/dashboard/operations");
  redirect("/dashboard/operations?success=property");
}
export async function addUnit(f: FormData) {
  const {supabase,organization_id}=await workspace(f);
  const property_id=String(f.get("property_id")??""); const unit_number=String(f.get("unit_number")??"").trim(); const monthly_rent=Number(f.get("monthly_rent"));
  if(!property_id||!unit_number||!Number.isFinite(monthly_rent)||monthly_rent<0) redirect("/dashboard/operations?error=unit");
  const {error}=await supabase.from("units").insert({organization_id,property_id,unit_number,monthly_rent,currency:"KES",status:"vacant"});
  if (error) { console.error("PropertyOS addUnit failed:", error.code); redirect("/dashboard/operations?error=unit"); }
  revalidatePath("/dashboard/operations");
  redirect("/dashboard/operations?success=unit");
}
export async function addTenant(f: FormData) {
  const {supabase,organization_id}=await workspace(f);
  const full_name=String(f.get("full_name")??"").trim(); if(full_name.length<2) redirect("/dashboard/operations?error=tenant");
  const {error}=await supabase.from("tenants").insert({organization_id,full_name,email:String(f.get("email")??"").trim().toLowerCase()||null,phone:String(f.get("phone")??"").trim()||null});
  if (error) { console.error("PropertyOS addTenant failed:", error.code); redirect("/dashboard/operations?error=tenant"); }
  revalidatePath("/dashboard/operations");
  redirect("/dashboard/operations?success=tenant");
}
export async function addLease(f: FormData) {
  const {supabase,organization_id}=await workspace(f);
  const unit_id=String(f.get("unit_id")??""); const tenant_id=String(f.get("tenant_id")??""); const start_date=String(f.get("start_date")??""); const monthly_rent=Number(f.get("monthly_rent")); const rent_due_day=Number(f.get("rent_due_day")??1);
  if(!unit_id||!tenant_id||!start_date||!Number.isFinite(monthly_rent)||monthly_rent<0||rent_due_day<1||rent_due_day>28) redirect("/dashboard/operations?error=lease");
  const {error}=await supabase.from("leases").insert({organization_id,unit_id,tenant_id,start_date,monthly_rent,rent_due_day,status:"active"});
  if (error) { console.error("PropertyOS addLease failed:", error.code); redirect("/dashboard/operations?error=lease"); }
  revalidatePath("/dashboard/operations");
  redirect("/dashboard/operations?success=lease");
}
export async function addRentCharge(f: FormData) {
  const {supabase,organization_id}=await workspace(f);
  const lease_id=String(f.get("lease_id")??""); const billing_period=String(f.get("billing_period")??""); const due_date=String(f.get("due_date")??""); const amount=Number(f.get("amount"));
  const validMonth=/^\\d{4}-(0[1-9]|1[0-2])$/.test(billing_period);
  const validDate=/^\\d{4}-\\d{2}-\\d{2}$/.test(due_date) && !Number.isNaN(Date.parse(due_date));
  if(!lease_id||!validMonth||!validDate||!Number.isFinite(amount)||amount<=0) redirect("/dashboard/operations?error=charge");
  const {data:lease,error:leaseError}=await supabase.from("leases").select("id").eq("id",lease_id).eq("organization_id",organization_id).eq("status","active").maybeSingle();
  if(leaseError||!lease) redirect("/dashboard/operations?error=charge_lease");
  const billingDate=billing_period+"-01";
  const {data:existingCharge,error:existingError}=await supabase.from("rent_charges").select("id").eq("organization_id",organization_id).eq("lease_id",lease_id).eq("billing_period",billingDate).limit(1).maybeSingle();
  if(existingError||existingCharge) redirect("/dashboard/operations?error=duplicate_charge");
  const {error}=await supabase.from("rent_charges").insert({organization_id,lease_id,billing_period:billingDate,due_date,amount,amount_paid:0,status:"unpaid"});
  if (error) { console.error("PropertyOS addRentCharge failed:", error.code); redirect("/dashboard/operations?error=charge"); }
  revalidatePath("/dashboard/operations");
  redirect("/dashboard/operations?success=charge");
}

function normalizeMpesaPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (/^0[17]\d{8}$/.test(digits)) return `254${digits.slice(1)}`;
  if (/^254[17]\d{8}$/.test(digits)) return digits;
  if (/^[17]\d{8}$/.test(digits)) return `254${digits}`;
  return null;
}

function darajaTimestamp() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}${values.month}${values.day}${values.hour}${values.minute}${values.second}`;
}

export async function startMpesaSandboxPayment(f: FormData) {
  const { supabase, organization_id } = await workspace(f);
  const rentChargeId = String(f.get("rent_charge_id") ?? "");
  const phone = normalizeMpesaPhone(String(f.get("phone_number") ?? ""));
  if (!rentChargeId || !phone) redirect("/dashboard/operations?error=mpesa_phone");

  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  const { data: member } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", organization_id)
    .eq("user_id", userId)
    .maybeSingle();
  if (!member || !["landlord", "property_manager", "accountant"].includes(member.role)) {
    redirect("/dashboard/operations?error=access");
  }

  const { data: charge } = await supabase
    .from("rent_charges")
    .select("id, organization_id, amount, amount_paid, status, lease_id, leases(tenant_id)")
    .eq("id", rentChargeId)
    .eq("organization_id", organization_id)
    .maybeSingle();
  const lease = charge ? (Array.isArray(charge.leases) ? charge.leases[0] : charge.leases) : null;
  const tenantId = (lease as { tenant_id?: string } | null)?.tenant_id;
  const remaining = charge ? Number(charge.amount) - Number(charge.amount_paid) : 0;
  if (!charge || !tenantId || !Number.isInteger(remaining) || remaining < 1 || charge.status === "paid") {
    redirect("/dashboard/operations?error=mpesa_charge");
  }

  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
  const passkey = process.env.MPESA_PASSKEY;
  const shortcode = process.env.MPESA_SHORTCODE || "174379";
  const callbackOrigin = process.env.MPESA_CALLBACK_ORIGIN;
  const callbackToken = process.env.MPESA_CALLBACK_TOKEN;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (
    process.env.MPESA_ENVIRONMENT !== "sandbox" ||
    !consumerKey || !consumerSecret || !passkey ||
    !callbackOrigin || !callbackToken || !supabaseUrl || !serviceKey
  ) {
    redirect("/dashboard/operations?error=mpesa_config");
  }

  const callbackBase = new URL(callbackOrigin);
  if (callbackBase.protocol !== "https:" || callbackBase.pathname !== "/" || callbackBase.search || callbackBase.hash) {
    redirect("/dashboard/operations?error=mpesa_config");
  }
  const callbackUrl = new URL(
    `/api/payments/mpesa/callback/${encodeURIComponent(callbackToken)}`,
    callbackBase.origin
  ).toString();

  const { data: pendingPayments } = await supabase
    .from("payments")
    .select("id")
    .eq("rent_charge_id", rentChargeId)
    .eq("organization_id", organization_id)
    .eq("method", "mpesa")
    .eq("status", "pending")
    .limit(1);
  if (pendingPayments?.length) redirect("/dashboard/operations?error=mpesa_pending");

  const { data: payment, error: insertError } = await supabase
    .from("payments")
    .insert({
      organization_id,
      rent_charge_id: rentChargeId,
      tenant_id: tenantId,
      amount: remaining,
      currency: "KES",
      method: "mpesa",
      status: "pending",
      recorded_by: null,
      notes: "Daraja sandbox STK Push",
    })
    .select("id")
    .single();
  if (insertError || !payment) redirect("/dashboard/operations?error=mpesa_start");

  try {
    const basic = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
    const authResponse = await fetch(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      { headers: { Authorization: `Basic ${basic}` }, cache: "no-store", signal: AbortSignal.timeout(15000) }
    );
    const authPayload = await authResponse.json();
    if (!authResponse.ok || !authPayload.access_token) throw new Error("Daraja authentication failed");

    const timestamp = darajaTimestamp();
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
    const stkResponse = await fetch("https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authPayload.access_token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: process.env.MPESA_TRANSACTION_TYPE || "CustomerPayBillOnline",
        Amount: remaining,
        PartyA: phone,
        PartyB: shortcode,
        PhoneNumber: phone,
        CallBackURL: callbackUrl,
        AccountReference: `POS-${rentChargeId.slice(0, 8)}`,
        TransactionDesc: "PropertyOS rent payment",
      }),
    });
    const stkPayload = await stkResponse.json();
    if (!stkResponse.ok || String(stkPayload.ResponseCode) !== "0" || !stkPayload.CheckoutRequestID) {
      throw new Error("Daraja did not accept the STK request");
    }

    const { error: updateError } = await supabase
      .from("payments")
      .update({
        provider_checkout_id: String(stkPayload.CheckoutRequestID),
        provider_reference: stkPayload.MerchantRequestID ? String(stkPayload.MerchantRequestID) : null,
      })
      .eq("id", payment.id)
      .eq("status", "pending");
    if (updateError) throw new Error("Could not save the Daraja checkout reference");
  } catch {
    await supabase
      .from("payments")
      .update({ status: "failed", notes: "Daraja sandbox request could not be initiated." })
      .eq("id", payment.id)
      .eq("status", "pending");
    redirect("/dashboard/operations?error=mpesa_start");
  }

  redirect("/dashboard/operations?success=mpesa");
}
