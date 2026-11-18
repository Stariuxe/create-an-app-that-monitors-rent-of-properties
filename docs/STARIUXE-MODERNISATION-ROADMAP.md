# Stariuxe Enterprises — Modernisation Roadmap

Last reviewed: 2026-11-18

## Portfolio inventory

| Repository | Current evidence | Recommended treatment |
|---|---|---|
| create-an-app-that-monitors-rent-of-properties | Populated Next.js 15 / React 19 / TypeScript codebase for PropertyOS AI; connected to Vercel and Supabase | Flagship product. Prioritise real workflows, reliability, accessibility, security, performance and conversion |
| OPENHIGSFIELD | Empty GitHub repository | Do not deploy or modify until a product brief and source code exist |
| VOICESTUDIO | Empty GitHub repository | Do not deploy or modify until a product brief and source code exist |
| OPENSEO | Empty GitHub repository | Do not deploy or modify until a product brief and source code exist |
| APPFLOW | Empty GitHub repository | Do not deploy or modify until a product brief and source code exist |
| COUCOU | Empty GitHub repository | Do not deploy or modify until a product brief and source code exist |
| OPENPROJECT | Empty GitHub repository | Do not deploy or modify until a product brief and source code exist |
| CAL.COM | Empty GitHub repository | Do not deploy or modify until a product brief and source code exist |
| CHATWOOT | Empty GitHub repository | Do not deploy or modify until a product brief and source code exist |
| CAP | Empty GitHub repository | Do not deploy or modify until a product brief and source code exist |

## Verified platform observations

### Production smoke test
- `https://propertyosai.cc.cd/` loaded publicly without authentication.
- `/api/health` returned `status: ok`.
- `/signup` and `/login` both loaded without visible errors.
- Unauthenticated access to `/dashboard` redirected to `/login?next=%2Fdashboard`; protected dashboard content was not exposed.
- Vercel reports the production deployment as `READY`, with the custom PropertyOS domains assigned as aliases. The current production commit is `d5a657705d219927683271b292dbad1ed9680232`.
- The latest deployment on a feature branch is a preview, not the production release. Do not mistake a preview `READY` status for production.

### Supabase and access-control review
- Project `yxqhujnhsxbxjfvzoskv` reports `ACTIVE_HEALTHY`.
- All 12 inspected public application tables have RLS enabled.
- Organization membership policies check the signed-in user's membership and staff role. The private helper functions use a fixed empty search path and check `auth.uid()`.
- The public M-Pesa confirmation RPC is `SECURITY DEFINER`, but its execute privileges are restricted to `service_role`; neither `anon` nor `authenticated` can execute it.
- `pilot_leads` has RLS enabled with no table policies. This is appropriate only while writes are performed by the trusted server-side route using a privileged key; never grant browser access merely to silence the advisor.
- Security advisor: leaked-password protection is disabled. Enable it in Supabase Authentication password security settings.
- Performance advisor: multiple permissive policies and unused-index notices exist. Do not remove or merge them without reviewing real query patterns and preserving tenant access semantics.
- No Supabase health-advisor findings were returned.

### Vercel environment hygiene
- Required M-Pesa sandbox variable names and Supabase server-key variable names are present in the project inventory for the inspected environments. Secret values were not retrieved or displayed; presence does not prove correctness.
- The environment inventory contains many overlapping/legacy Turnstile variable names and several opaque token-like variable names. Audit their code references before removing anything. Do not paste secret values into chat or commit them.
- The Daraja callback uses a bearer token in the URL path, constant-time token comparison, server-only Supabase credentials, pending-payment checks and a database reconciliation RPC. No live or sandbox payment was initiated during this review.

### Product readiness caveats
- The marketing site labels the dashboard figures as illustrative and several product capabilities as planned. Keep these disclosures until each feature is implemented and tested.
- The current PWA is installable from supported browsers but is not a native Android APK.
- The Instagram Reel could not be read by the public page reader. Do not invent its techniques; use a recording or screenshots before copying its exact effects.

## Delivery order

### Phase 1 — Protect the existing system
1. Keep changes on feature branches and use Vercel preview deployments before production promotion.
2. Verify domain routing, production target, build output and public health checks.
3. Review Supabase RLS, tenant/property ownership boundaries, auth redirects and storage policies without exposing secrets or tenant records.
4. Add automated type-check, build, accessibility and smoke-test gates.
5. Enable leaked-password protection in Supabase Auth settings and review the duplicated environment-variable inventory.

### Phase 2 — Make PropertyOS dependable
1. Validate landlord onboarding and workspace creation using a dedicated test account.
2. Test property/unit setup, tenant/lease creation, rent-charge selection and arrears display end-to-end.
3. Verify form loading, success and error states; prevent blank screens and lost input.
4. Test Daraja sandbox initiation, callback authentication, idempotency and reconciliation with a test phone before enabling real payments.
5. Keep dashboard metrics clearly labelled as sample data until backed by verified records.

### Phase 3 — Modernise the experience
1. Establish a consistent responsive design system and accessible navigation.
2. Use restrained motion, reduced-motion support, fast-loading imagery and mobile-first layouts.
3. Improve SEO metadata, structured data, sitemap, robots rules and share previews.
4. Make installability clear: PWA is not a native APK.
5. Connect pilot enquiry capture to a monitored, consent-aware workflow.

### Phase 4 — Portfolio expansion
1. Give every empty repository a one-page product brief, intended customer, core workflow, monetisation model and technical owner before implementation.
2. Create a common Stariuxe portfolio dashboard only after product boundaries and access controls are defined.
3. Reuse shared components and operational patterns where appropriate; do not combine unrelated customer data or secrets.

## Release rule

No production deployment, payment activation, destructive database operation, secret exposure or change to customer access controls should occur without a verified preview, appropriate tests and explicit release approval.
