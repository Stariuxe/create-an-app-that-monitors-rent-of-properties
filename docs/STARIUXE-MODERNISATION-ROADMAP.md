# Stariuxe Enterprises — Modernisation Roadmap

Last reviewed: 2026-11-18

## Portfolio inventory

| Repository | Current evidence | Recommended treatment |
|---|---|---|
| create-an-app-that-monitors-rent-of-properties | Populated Next.js 15 / React 19 / TypeScript codebase for the PropertyOS AI public website; connected to Vercel and Supabase | Flagship product. Prioritise real product workflows, reliability, accessibility, security, performance and conversion |
| OPENHIGSFIELD | Empty GitHub repository | Do not deploy or modify until a project brief and source code exist |
| VOICESTUDIO | Empty GitHub repository | Do not deploy or modify until a project brief and source code exist |
| OPENSEO | Empty GitHub repository | Do not deploy or modify until a project brief and source code exist |
| APPFLOW | Empty GitHub repository | Do not deploy or modify until a project brief and source code exist |
| COUCOU | Empty GitHub repository | Do not deploy or modify until a project brief and source code exist |
| OPENPROJECT | Empty GitHub repository | Do not deploy or modify until a project brief and source code exist |
| CAL.COM | Empty GitHub repository | Do not deploy or modify until a project brief and source code exist |
| CHATWOOT | Empty GitHub repository | Do not deploy or modify until a project brief and source code exist |
| CAP | Empty GitHub repository | Do not deploy or modify until a project brief and source code exist |

## Verified platform observations

- Supabase project `yxqhujnhsxbxjfvzoskv` reported `ACTIVE_HEALTHY` at review time.
- Vercel project `propertyos-ai` is connected to the PropertyOS repository.
- Latest Vercel deployment record was `READY`, but its target was not identified as production. The Vercel project reported `live: false`; therefore this review does not certify production launch.
- PropertyOS source includes a public liveness endpoint at `/api/health` and a scheduled GitHub Actions uptime workflow.
- The public marketing-page README describes dashboard figures as illustrative and identifies some product capabilities as planned. Marketing copy must not imply these features are live until verified.
- The Instagram reference Reel could not be fetched by the available public page reader. Its techniques must not be guessed; obtain a screen recording or screenshots before reproducing its specific effects.

## Delivery order

### Phase 1 — Protect the existing system
1. Keep all changes on feature branches and use Vercel preview deployments before production promotion.
2. Verify domain routing, production deployment target, build output and public health checks.
3. Review Supabase Row Level Security, tenant/property ownership boundaries, authentication redirects and storage policies without exposing secrets or tenant records.
4. Add automated type-check, build, accessibility and smoke-test gates.

### Phase 2 — Make PropertyOS dependable
1. Fix landlord onboarding, workspace creation, property/unit setup and rent-charge selection.
2. Ensure form submissions have loading, success and actionable error states; prevent blank screens and lost input.
3. Validate tenant isolation and server-side authorization for every protected data operation.
4. Test Daraja sandbox payment initiation, callback verification, idempotency and reconciliation before enabling real payments.
5. Keep all dashboard metrics clearly labelled as sample data until backed by verified records.

### Phase 3 — Modernise the experience
1. Establish a consistent responsive design system and accessible navigation.
2. Use restrained motion, reduced-motion support, fast-loading imagery and mobile-first layouts.
3. Improve SEO metadata, structured data, sitemap, robots rules and share previews.
4. Make installability clear: the current PWA is not a native APK.
5. Connect the pilot enquiry form to a monitored, consent-aware lead workflow.

### Phase 4 — Portfolio expansion
1. Give every empty repository a one-page product brief, intended customer, core workflow, monetisation model and technical owner before implementation.
2. Create a common Stariuxe portfolio dashboard only after the individual project boundaries and access controls are defined.
3. Reuse shared components and operational patterns where appropriate; do not combine unrelated customer data or secrets.

## Release rule

No production deployment, payment activation, destructive database operation, secret exposure or change to customer access controls should occur without a verified preview, appropriate tests and explicit release approval.
