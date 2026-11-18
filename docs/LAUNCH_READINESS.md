# PropertyOS AI — launch readiness

**Parent enterprise:** Stariuxe Enterprises  
**Public site:** https://propertyosai.cc.cd/  
**Product:** Kenya-first rental property operations SaaS  
**Current stage:** controlled pilot preparation — not a general paid launch

This document separates verified infrastructure from work that still requires configuration, user testing, legal review, or a business decision.

## Verified

- Production Vercel deployment for the latest signup fix is READY.
- Supabase project is ACTIVE_HEALTHY.
- Core tables exist for profiles, organizations, memberships, properties, units, tenants, leases, rent charges, payments, reminders and maintenance requests. RLS is enabled on these tables.
- The secure pilot-lead storage migration has been applied. `public.pilot_leads` has RLS enabled, and direct `anon` / `authenticated` table privileges are revoked.
- The pilot lead-capture implementation is in PR #4 and deliberately fails closed until required anti-bot and server credentials are configured.
- M-Pesa sandbox initiation and callback code exist in the landlord operations workflow; successful end-to-end payment has not been verified.

## Blocking items before accepting pilot customer data

1. **Complete the pilot lead-capture PR.** Vercel deployment API quota has blocked the latest preview build for 24 hours. Do not merge until a build for the latest PR commit passes and the preview is reviewed.
2. **Configure Vercel variables for pilot enquiries:**
   - `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
   - `TURNSTILE_SECRET_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only; never use a `NEXT_PUBLIC_` prefix)
3. **Configure M-Pesa sandbox credentials:** `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_PASSKEY`, plus a valid server-side Supabase secret key. Keep `MPESA_ENVIRONMENT=sandbox` until the complete test suite passes. Current environment inventory did not show the consumer key, consumer secret or passkey.
4. **Test with the founder's own account:** registration, sign-in, workspace creation, adding a property, unit, tenant, lease and rent charge, and access to the landlord dashboard. Do not use real tenant data for this test.
5. **Test Daraja sandbox end-to-end:** STK request, callback authentication, successful/failed/cancelled results, amount mismatch, duplicate callbacks, duplicate pending request, and rent-charge reconciliation. Sandbox success is not proof of production readiness.
6. **Verify the AI assistant:** ensure the Vercel AI Gateway credential is configured, test rate limiting and error handling, and verify the assistant never requests secrets or claims to execute actions it cannot perform.
7. **Enable Supabase leaked-password protection** in Auth security settings and rerun security advisors. Do not weaken tenant/landlord RLS to resolve access errors.
8. **Review privacy and legal documents** before collecting real tenant information. Complete data-controller / processor role analysis, ODPC applicability and registration/exemption assessment, retention/deletion process, data-subject request handling, breach response and vendor/data-transfer review.
9. **Complete company administration:** obtain the approved BRS registration certificate and confirm legal name, KRA/iTax details, business bank account, invoicing/tax obligations and customer support contact. PropertyOS AI Limited remains a proposed name until BRS approval is confirmed.

## Revenue and go-to-market

- Start with a small, invitation-only landlord pilot after the blocking items above pass.
- Offer onboarding and collect structured feedback before paid conversion.
- Agree plan limits, customer support scope, cancellation/refund terms and pricing before publishing a price list.
- Illustrative price hypotheses only: Starter KES 500/month, Growth KES 1,000/month, Professional KES 2,500/month. These are not approved prices and are not configured in billing.
- No Ads Manager account is currently accessible, so no campaign has been created or activated. Do not spend on ads until account access, creative, landing page, targeting, budget and spend authorization are confirmed.
- Stripe's country availability must be checked against the actual legal entity and bank account. Do not route a Kenyan business through a foreign entity or account without eligibility and compliance review. Prioritize a verified local M-Pesa collection path for Kenya.

## Explicit no-go conditions

Do not describe the service as fully launched, accept real tenant identity documents or live rent payments, or run paid advertising while any critical item above remains unverified. Do not invent customer counts, rent collected, testimonials, certifications, security guarantees or product capabilities.
