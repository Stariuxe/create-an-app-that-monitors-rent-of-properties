# PropertyOS AI — launch readiness

**Parent enterprise:** Stariuxe Enterprises  
**Public site:** https://propertyosai.cc.cd/  
**Product:** Kenya-first rental property operations SaaS  
**Current stage:** controlled pilot preparation — not a general paid launch

This document separates verified infrastructure from work that still requires configuration, user testing, legal review, or a business decision.

## Verified

- Latest production deployment for the signup fix is READY on commit `d5a657705d219927683271b292dbad1ed9680232`.
- Supabase project is ACTIVE_HEALTHY.
- Core tables exist for profiles, organizations, memberships, properties, units, tenants, leases, rent charges, payments, reminders and maintenance requests. RLS is enabled on these tables.
- The secure pilot-lead storage migration has been applied. `public.pilot_leads` has RLS enabled, and direct `anon` / `authenticated` table privileges are revoked.
- PR #4's exact latest commit `4c55b86a22ef8ad1e70f86a80b09a3e0191bc5ab` passed GitHub Actions type-check and Next.js build.
- The Turnstile environment variable names `NEXT_2_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY_12_` exist in Vercel for Production and Preview. Values are not exposed by the inventory check; live Siteverify is not yet confirmed.
- M-Pesa sandbox initiation and callback code exist in the landlord operations workflow; successful end-to-end payment has not been verified.

## Blocking items before accepting pilot customer data

1. **Complete the pilot lead-capture PR.** PR #4 remains open. Vercel's deployment API quota previously blocked the latest preview build. Do not merge until a preview built from the exact latest commit is available and reviewed.
2. **Complete pilot enquiry environment configuration:**
   - Keep the existing Turnstile variable names `NEXT_2_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY_12_`; the code supports them. Verify that the saved values are the correct Cloudflare site and secret keys and are scoped to Production and Preview.
   - Add `SUPABASE_SERVICE_ROLE_KEY` as a server-only Vercel secret for the environments being tested. It is currently absent from the environment-name inventory. Never use a `NEXT_PUBLIC_` prefix.
3. **Test the form after deployment:** complete a real Turnstile challenge on the official domain, submit a consented test enquiry, and verify the row is stored in `public.pilot_leads`. Confirm duplicate handling and failure states. Delete the test lead according to the approved retention process.
4. **Configure and verify M-Pesa sandbox credentials:** `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_PASSKEY`, plus a valid server-side Supabase secret key. Keep `MPESA_ENVIRONMENT=sandbox` until the complete test suite passes. Current environment inventory did not show the consumer key, consumer secret or passkey.
5. **Test with the founder's own account:** registration, sign-in, workspace creation, adding a property, unit, tenant, lease and rent charge, and access to the landlord dashboard. Do not use real tenant data for this test.
6. **Test Daraja sandbox end-to-end:** STK request, callback authentication, successful/failed/cancelled results, amount mismatch, duplicate callbacks, duplicate pending request, and rent-charge reconciliation. Sandbox success is not proof of production readiness.
7. **Verify the AI assistant:** ensure the Vercel AI Gateway credential is configured, test rate limiting and error handling, and verify the assistant never requests secrets or claims to execute actions it cannot perform.
8. **Enable Supabase leaked-password protection** in Auth security settings and rerun security advisors. Do not weaken tenant/landlord RLS to resolve access errors.
9. **Review privacy and legal documents** before collecting real tenant information. Complete data-controller / processor role analysis, ODPC applicability and registration/exemption assessment, retention/deletion process, data-subject request handling, breach response and vendor/data-transfer review.
10. **Complete company administration:** obtain the approved BRS registration certificate and confirm legal name, KRA/iTax details, business bank account, invoicing/tax obligations and customer support contact. PropertyOS AI Limited remains a proposed name until BRS approval is confirmed.

## Current security and performance findings

- Supabase Auth leaked-password protection is disabled (WARN); enable it in Auth security settings.
- The database advisor reports multiple permissive policies on several tenant-facing tables. Review and consolidate only after role-based regression tests prove landlord and tenant access remains correct.
- The advisor reports 18 unused indexes. Do not remove them during the pilot without query-plan and workload evidence.
- The `pilot_leads` table has RLS enabled and no policies, which means direct client access is denied by default; server-side service-role insertion is the intended path.

## Revenue and go-to-market

- Start with a small, invitation-only landlord pilot after the blocking items above pass.
- Offer onboarding and collect structured feedback before paid conversion.
- Agree plan limits, customer support scope, cancellation/refund terms and pricing before publishing a price list.
- Illustrative price hypotheses only: Starter KES 500/month, Growth KES 1,000/month, Professional KES 2,500/month. These are not approved prices and are not configured in billing.
- No Ads Manager account is currently accessible, so no campaign has been created or activated. Do not spend on ads until account access, creative, landing page, targeting, budget and spend authorization are confirmed.
- Stripe's country availability must be checked against the actual legal entity and bank account. Do not route a Kenyan business through a foreign entity or account without eligibility and compliance review. Prioritize a verified local M-Pesa collection path for Kenya.

## Explicit no-go conditions

Do not describe the service as fully launched, accept real tenant identity documents or live rent payments, or run paid advertising while any critical item above remains unverified. Do not invent customer counts, rent collected, testimonials, certifications, security guarantees or product capabilities.
