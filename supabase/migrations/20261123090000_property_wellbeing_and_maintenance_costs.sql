-- Adds landlord wellbeing reports and cost/payment tracking for maintenance requests.
alter table public.maintenance_requests
  add column if not exists estimated_cost numeric(12,2),
  add column if not exists actual_cost numeric(12,2),
  add column if not exists amount_paid numeric(12,2) not null default 0,
  add column if not exists payment_status text not null default 'unpaid',
  add column if not exists paid_at timestamptz,
  add column if not exists payment_reference text;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'maintenance_requests_payment_status_check') then
    alter table public.maintenance_requests add constraint maintenance_requests_payment_status_check check (payment_status in ('unpaid','partially_paid','paid'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'maintenance_requests_costs_nonnegative_check') then
    alter table public.maintenance_requests add constraint maintenance_requests_costs_nonnegative_check check ((estimated_cost is null or estimated_cost >= 0) and (actual_cost is null or actual_cost >= 0) and amount_paid >= 0 and (actual_cost is null or amount_paid <= actual_cost));
  end if;
end $$;

create table if not exists public.property_wellbeing_reports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 160),
  report_body text not null default '' check (char_length(report_body) <= 10000),
  period_start date not null,
  period_end date not null,
  metrics jsonb not null default '{}'::jsonb,
  recipient_email text,
  sent_at timestamptz,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint property_wellbeing_reports_period_check check (period_end >= period_start),
  constraint property_wellbeing_reports_property_org_fkey foreign key (property_id, organization_id) references public.properties(id, organization_id) on delete cascade
);

create index if not exists maintenance_requests_org_unit_created_idx on public.maintenance_requests(organization_id, unit_id, created_at desc);
create index if not exists property_wellbeing_reports_org_property_created_idx on public.property_wellbeing_reports(organization_id, property_id, created_at desc);

alter table public.property_wellbeing_reports enable row level security;
drop policy if exists "Wellbeing reports staff manage" on public.property_wellbeing_reports;
create policy "Wellbeing reports staff manage" on public.property_wellbeing_reports
for all to authenticated
using (private.is_org_staff(organization_id))
with check (private.is_org_staff(organization_id) and created_by = (select auth.uid()) and exists (
  select 1 from public.properties p where p.id = property_id and p.organization_id = property_wellbeing_reports.organization_id
));
grant select, insert, update, delete on public.property_wellbeing_reports to authenticated;
