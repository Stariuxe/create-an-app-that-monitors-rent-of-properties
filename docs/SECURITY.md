# PropertyOS AI — Security and Data-Handling Baseline

**Owner:** Stariuxe Enterprises  
**Status:** Internal operational baseline; not a certification or legal opinion  
**Review cadence:** At each release and at least quarterly

## 1. Security principles

- Enforce organisation-level isolation in both Supabase Row Level Security (RLS) policies and relational constraints.
- Use least privilege for landlords, property managers, accountants, caretakers and tenants.
- Keep Supabase secret/service-role keys, M-Pesa credentials, AI gateway credentials and signing secrets on the server only. Never use a `NEXT_PUBLIC_` prefix for secrets.
- Require authenticated, server-verified identity for protected operations. Never trust a hidden form field, client-supplied role or user-editable metadata as proof of access.
- Keep payment state changes server-side and idempotent. A browser redirect or tenant screenshot is not proof of payment.
- Log security-relevant events without logging passwords, OTPs, tokens, full identity numbers or payment credentials.

## 2. Data handling

PropertyOS may process names, phone numbers, email addresses, tenancy records, rent balances, payment references, emergency contacts and identity-related fields.

- Collect only fields required for a defined property-management purpose.
- Restrict sensitive tenant fields to staff roles with a legitimate operational need.
- Do not put tenant records, national ID details, payment exports, database dumps, credentials or private support conversations into public AI chat tools or unapproved third-party services.
- Use synthetic or irreversibly de-identified examples for AI-assisted debugging and prompt testing.
- Define retention and deletion periods before onboarding live customers; honour lawful access, correction and deletion requests.
- Publish a privacy notice and appropriate controller/processor terms before production customer onboarding. Obtain Kenyan privacy counsel/ODPC guidance on registration and DPIA obligations where applicable.

## 3. Authentication and access

- Verify the Supabase user on the server for every protected action.
- Use RLS on every exposed table and test access using separate landlord, staff and tenant accounts.
- Keep role/permission data in trusted server-controlled records, not user-editable profile metadata.
- Require both `USING` and `WITH CHECK` for update policies where appropriate.
- Keep privileged functions in non-exposed schemas where practical. For any exposed `SECURITY DEFINER` function, explicitly revoke default execution and grant only the minimum required role.
- Enable email confirmation and leaked-password protection where supported by the current Supabase plan and project configuration. If the feature is unavailable on the plan, document the limitation and use strong password controls and MFA where supported.

## 4. Payments

- Keep the integration in Daraja sandbox until Safaricom production credentials, callbacks, settlement and reconciliation have been independently tested and approved.
- Store callback secrets only in server-side environment variables. Rotate them immediately if exposed.
- Match callbacks to a stored checkout identifier and expected amount; reject mismatches and duplicate confirmations.
- Reconcile payment and rent-charge updates atomically in the database.
- Never mark a payment as confirmed based only on a client request.
- Keep sandbox and production credentials, callback URLs and transaction types separate.

## 5. Incident response

1. Contain the issue: disable the affected integration or revoke the exposed credential.
2. Preserve relevant timestamps, request IDs and non-sensitive logs.
3. Determine affected accounts, records and processing systems.
4. Rotate credentials and invalidate sessions where appropriate.
5. Restore from a verified backup if data integrity was affected.
6. Assess notification duties and timelines with the organisation's privacy/legal lead and relevant authorities.
7. Record root cause, corrective actions, owner and verification evidence.

## 6. Current review notes

The connected Supabase review on 16 November 2026 found:
- Leaked-password protection disabled (configuration action required in Supabase Auth settings; not a SQL change).
- Performance advisories for overlapping permissive policies and unused indexes. These are not automatically vulnerabilities. Review query plans and policy semantics before changing them.
- The M-Pesa confirmation RPC is `SECURITY DEFINER`, but direct execution was verified as unavailable to `anon` and `authenticated`, and available to `service_role`. Preserve this restriction.
- Composite foreign keys bind units to properties, leases to units/tenants, rent charges to leases, and payments to rent charges/tenants within the same organisation. Preserve these integrity constraints.

This review is a point-in-time snapshot, not a penetration test or guarantee of security.
