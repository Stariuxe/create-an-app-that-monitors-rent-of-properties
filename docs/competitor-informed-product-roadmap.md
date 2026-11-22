# PropertyOS AI — Competitor-informed product roadmap

Research reviewed on 22 November 2026. This is a product-gap assessment, not a claim that these capabilities are already implemented.

## Competitor patterns worth learning from

- **Buildium**: resident self-service for payments, maintenance requests with photos, document access, two-way messaging, scheduled reminders, work orders, vendor assignment, inspection records, owner reporting and mobile access.
- **AppFolio**: end-to-end maintenance work orders, inspections, unit-turn workflows, vendor/bill coordination, maintenance performance signals, audit history, portfolio-wide analytics and AI-assisted task workflows.
- **Landlord Studio**: landlord-oriented rent tracking, expense capture, property-level accounting and reporting.

Sources:
- Buildium Resident Center: https://www.buildium.com/features/resident-center/
- Buildium Maintenance: https://www.buildium.com/features/property-management-maintenance-software/
- Buildium Owner Portal: https://www.buildium.com/features/property-owner-portal/
- AppFolio Maintenance: https://www.appfolio.com/property-manager/maintenance
- AppFolio Performance Platform: https://www.appfolio.com/performance-platform
- Landlord Studio: https://www.landlordstudio.com/

## Current PropertyOS AI baseline

Already present in the application (verify live behavior before launch claims):
- Property, unit, tenant, lease and rent-charge operations.
- Rent charge balance and payment tracking, including Daraja sandbox flow.
- Portfolio Intelligence with property-level expense, maintenance, compliance, financing, valuation and other-income records.
- Property and portfolio summaries.

## Recommended additions, in priority order

### P0 — Core landlord workflow
1. Persistent workspace navigation across all authenticated pages, including a clear return-to-workspace action from Portfolio Intelligence.
2. Maintenance request and work-order lifecycle: tenant/landlord submission, photos, urgency, assignee/vendor, quote, due date, status timeline, completion notes and linked expense.
3. Lease and property document vault: upload, categorize, expiry dates, access controls, download and audit trail.
4. Rent reminders and lease-expiry reminders with in-app notifications first; SMS/email integrations only after consent, delivery tracking and cost controls.
5. Activity and audit history for sensitive changes to rent charges, payments, leases, tenant details and maintenance records.

### P1 — Better portfolio control
6. Scheduled and downloadable reports: rent roll, arrears aging, income/expense statement, occupancy, maintenance spend and property-level owner statement (CSV/PDF).
7. Inspection checklist with date, unit, condition, notes, photos, responsible person and follow-up tasks.
8. Vendor directory and work-order assignment, quote approval and invoice/expense linking.
9. Vacancy and unit-turn tracker: notice received, move-out, inspection, repairs, cleaning, marketing and ready-to-let date.
10. Tenant self-service portal for balances, receipts, lease documents, maintenance tickets and contact details, with strict tenant-to-lease/property row-level access.

### P2 — Differentiation and scale
11. AI portfolio assistant that answers questions from the signed-in user's authorized data, explains anomalies, drafts reminders and proposes actions; require user approval before sending messages or changing records.
12. Owner/investor read-only portal with statements, property performance and approved documents.
13. Listing/leasing pipeline, applications and screening workflow, with lawful consent and Kenya-specific compliance review.
14. Integrations and automation framework with delivery logs, retries, idempotency and per-organization permissions.

## Kenya-first product safeguards

- Treat KES as the default currency and format dates for the user's locale.
- Keep M-Pesa payment states explicit: initiated, pending, confirmed, failed, reversed. Never mark rent as paid from an STK request alone; only reconcile on verified Daraja callback/query evidence.
- Design SMS/email reminders with opt-out, consent, delivery logs and per-tenant contact preferences.
- Apply organization/property/lease scoping and least-privilege RLS to every new table and storage bucket. Tenant portals must never expose another tenant's records.
- Store sensitive documents in private storage buckets with short-lived signed URLs, size/type validation and access logging.
- Do not add expensive or complex features before the core landlord workflow is stable and tested.

## Acceptance criteria for the navigation repair

- Portfolio Intelligence always displays a visible, keyboard-accessible “Back to Workspace” link to `/dashboard/operations`.
- Workspace and Portfolio Intelligence both retain the same top-level navigation.
- Navigation remains visible while scrolling and works on narrow mobile widths.
- Existing dashboard routes and data-entry forms remain available.
- No new database schema or permission changes are required for this navigation-only patch.
