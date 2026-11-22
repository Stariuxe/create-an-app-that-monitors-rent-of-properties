# Portfolio Intelligence

This route adds a separate landlord analytics and property-detail workspace at `/dashboard/portfolio`. It deliberately does not replace `/dashboard/operations`.

## Existing database contract
The implementation reuses `public.property_portfolio_records`, which is already present in the connected Supabase project. The table already enforces:
- `record_type`: expense, maintenance, compliance, mortgage, valuation, other_income
- `status`: recorded, planned, in_progress, completed, paid, overdue
- non-negative optional amount, title length 2–140, notes up to 2,000 characters
- organization/property foreign keys and created_by attribution

RLS is enabled with staff membership checks, creator attribution on insert, and property-to-organization validation. The app additionally resolves the authenticated user's staff membership and verifies property ownership server-side before insert/update.

## Calculation definitions
- Expected monthly rent: sum of active lease monthly_rent.
- Rent charged / collected / arrears: sums from rent_charges and amount_paid. Payments are not added separately, preventing double counting.
- Expenses: sum of portfolio records with type expense or maintenance.
- Other income: sum of records with type other_income.
- Net recorded income: rent-charge amount_paid + other income - recorded expenses.
- Occupancy: occupied units / all units in the workspace or selected property.
- Valuation and mortgage values are displayed in the saved record list and are not mixed into income.

All values are in KES, consistent with the current units/payments schema. No exchange-rate conversion or forecast is applied. The page labels cumulative rent totals as recorded charge/payment totals, not monthly performance.

## Verification
The feature was prepared against the live schema metadata and existing RLS policies. No production database migration, live data write, secret change, payment, merge, or deployment was performed. Run the repository's `npm run lint` and `npm run build` in CI before merge.
