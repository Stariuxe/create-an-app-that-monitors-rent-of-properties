# PropertyOS AI — Production Release Checklist

Use this checklist before promoting a change to production. Record the release date, commit SHA, reviewer and test evidence in the release record.

## Code and build

- [ ] Review the diff and confirm no secrets, tenant exports or test credentials were committed.
- [ ] Install from the committed lockfile and run the configured build/type-check commands.
- [ ] Resolve build errors and review warnings; do not suppress warnings without a documented reason.
- [ ] Verify login, logout, session refresh and protected-route redirects.
- [ ] Test workspace creation, landlord access and multiple-organisation selection.
- [ ] Test property, unit, tenant, lease and rent-charge creation with valid and invalid inputs.
- [ ] Verify loading, empty, error and retry states; no action should leave a blank screen.
- [ ] Check mobile layouts, keyboard navigation and reduced-motion preferences.

## Database and privacy

- [ ] Confirm RLS is enabled on every exposed table.
- [ ] Test cross-organisation reads and writes with at least two separate test organisations.
- [ ] Verify composite foreign keys prevent cross-organisation relationships.
- [ ] Review views and privileged functions for RLS bypass and least-privilege grants.
- [ ] Run Supabase security and performance advisors and record accepted risks.
- [ ] Verify backup completion and perform a restore test on a non-production target.
- [ ] Check that logs do not contain secrets or unnecessary tenant personal data.

## Payments

- [ ] Confirm environment is explicitly sandbox or production; never mix credentials.
- [ ] Test successful, failed, cancelled, duplicate and amount-mismatch callbacks.
- [ ] Verify payment confirmation is idempotent and rent balances reconcile exactly once.
- [ ] Confirm callback secrets are server-only and can be rotated.
- [ ] Do not enable real-money collection until Safaricom production approval and end-to-end reconciliation are complete.

## AI features

- [ ] Test that assistant answers do not disclose another organisation's data.
- [ ] Test prompt injection and requests for secrets or internal prompts.
- [ ] Confirm AI cannot make tenant eligibility, eviction, penalty or payment decisions.
- [ ] Use synthetic data for external AI testing and review provider terms before sharing any company data.

## Release and rollback

- [ ] Verify preview deployment and production build status.
- [ ] Smoke-test public pages and protected routes after deployment.
- [ ] Confirm canonical domains, HTTPS, CSP and other security headers.
- [ ] Monitor runtime errors and payment reconciliation after release.
- [ ] Keep the previous known-good deployment available for rollback.
- [ ] Record the deployment URL, commit SHA, test results and rollback owner.

A successful build is necessary but does not prove that authentication, data isolation, payment processing or privacy controls work correctly.
