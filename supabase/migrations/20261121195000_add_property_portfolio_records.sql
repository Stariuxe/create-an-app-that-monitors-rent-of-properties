-- Portfolio Intelligence: property-scoped operating and financial records.
create table if not exists public.property_portfolio_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  record_type text not null check (record_type in ('expense','maintenance','compliance','mortgage','valuation','other_income')),
  title text not null check (char_length(btrim(title)) between 2 and 140),
  amount numeric(14,2) check (amount is null or amount >= 0),
  record_date date not null default current_date,
  due_date date,
  status text not null default 'recorded' check (status in ('recorded','planned','in_progress','completed','paid','overdue')),
  notes text check (notes is null or char_length(notes) <= 2000),
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists property_portfolio_records_org_property_date_idx
  on public.property_portfolio_records (organization_id, property_id, record_date desc);
create index if not exists property_portfolio_records_org_type_idx
  on public.property_portfolio_records (organization_id, record_type);

alter table public.property_portfolio_records enable row level security;

drop policy if exists "portfolio records staff select" on public.property_portfolio_records;
create policy "portfolio records staff select"
  on public.property_portfolio_records for select to authenticated
  using (private.is_org_staff(organization_id));

drop policy if exists "portfolio records staff insert" on public.property_portfolio_records;
create policy "portfolio records staff insert"
  on public.property_portfolio_records for insert to authenticated
  with check (
    private.is_org_staff(organization_id)
    and created_by = (select auth.uid())
    and exists (
      select 1 from public.properties p
      where p.id = property_id and p.organization_id = property_portfolio_records.organization_id
    )
  );

drop policy if exists "portfolio records staff update" on public.property_portfolio_records;
create policy "portfolio records staff update"
  on public.property_portfolio_records for update to authenticated
  using (private.is_org_staff(organization_id))
  with check (
    private.is_org_staff(organization_id)
    and exists (
      select 1 from public.properties p
      where p.id = property_id and p.organization_id = property_portfolio_records.organization_id
    )
  );

drop policy if exists "portfolio records staff delete" on public.property_portfolio_records;
create policy "portfolio records staff delete"
  on public.property_portfolio_records for delete to authenticated
  using (private.is_org_staff(organization_id));

grant select, insert, update, delete on public.property_portfolio_records to authenticated;
