-- Landlord-configured collection methods and safe manual cash receipt recording.
create table if not exists public.payment_collection_methods (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  method_type text not null check (method_type in ('mpesa','bank','cash','other')),
  display_name text not null check (char_length(btrim(display_name)) between 2 and 100),
  account_name text,
  provider_name text,
  phone_number text,
  account_number text,
  instructions text,
  is_active boolean not null default true,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (account_name is null or char_length(account_name) <= 120),
  check (provider_name is null or char_length(provider_name) <= 80),
  check (phone_number is null or char_length(phone_number) <= 32),
  check (account_number is null or char_length(account_number) <= 80),
  check (instructions is null or char_length(instructions) <= 500)
);
create index if not exists payment_collection_methods_org_active_idx
  on public.payment_collection_methods (organization_id, is_active, created_at desc);
alter table public.payment_collection_methods enable row level security;
drop policy if exists "payment collection methods staff select" on public.payment_collection_methods;
create policy "payment collection methods staff select"
  on public.payment_collection_methods for select to authenticated
  using (private.is_org_staff(organization_id));
drop policy if exists "payment collection methods staff insert" on public.payment_collection_methods;
create policy "payment collection methods staff insert"
  on public.payment_collection_methods for insert to authenticated
  with check (private.is_org_staff(organization_id) and created_by = (select auth.uid()));
drop policy if exists "payment collection methods staff update" on public.payment_collection_methods;
create policy "payment collection methods staff update"
  on public.payment_collection_methods for update to authenticated
  using (private.is_org_staff(organization_id))
  with check (private.is_org_staff(organization_id));
drop policy if exists "payment collection methods staff delete" on public.payment_collection_methods;
create policy "payment collection methods staff delete"
  on public.payment_collection_methods for delete to authenticated
  using (private.is_org_staff(organization_id));
grant select, insert, update, delete on public.payment_collection_methods to authenticated;

create or replace function public.record_cash_rent_payment(
  p_organization_id uuid,
  p_rent_charge_id uuid,
  p_amount numeric,
  p_received_from text default null,
  p_reference text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := (select auth.uid());
  v_charge public.rent_charges%rowtype;
  v_tenant_id uuid;
  v_new_paid numeric;
  v_payment_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if not private.is_org_staff(p_organization_id) then
    raise exception 'Workspace access denied' using errcode = '42501';
  end if;
  if p_amount is null or p_amount <= 0 or p_amount > 999999999999 then
    raise exception 'Invalid cash payment amount' using errcode = '22023';
  end if;
  if p_received_from is not null and char_length(btrim(p_received_from)) > 120 then
    raise exception 'Payer name is too long' using errcode = '22023';
  end if;
  if p_reference is not null and char_length(btrim(p_reference)) > 120 then
    raise exception 'Receipt reference is too long' using errcode = '22023';
  end if;

  select * into v_charge
  from public.rent_charges
  where id = p_rent_charge_id and organization_id = p_organization_id
  for update;
  if not found then
    raise exception 'Rent charge not found' using errcode = 'P0002';
  end if;

  if p_amount > (v_charge.amount - v_charge.amount_paid) then
    raise exception 'Cash payment exceeds outstanding balance' using errcode = '22023';
  end if;

  select l.tenant_id into v_tenant_id
  from public.leases l
  where l.id = v_charge.lease_id and l.organization_id = p_organization_id;
  if v_tenant_id is null then
    raise exception 'Tenant not found for rent charge' using errcode = 'P0002';
  end if;

  v_new_paid := v_charge.amount_paid + p_amount;
  insert into public.payments (
    organization_id, rent_charge_id, tenant_id, amount, currency,
    method, status, paid_at, recorded_by, notes
  ) values (
    p_organization_id, p_rent_charge_id, v_tenant_id, p_amount, 'KES',
    'cash', 'confirmed', now(), v_user_id,
    concat_ws(' · ',
      case when nullif(btrim(p_received_from), '') is not null then 'Received from: ' || btrim(p_received_from) end,
      case when nullif(btrim(p_reference), '') is not null then 'Receipt/reference: ' || btrim(p_reference) end,
      'Cash recorded by landlord'
    )
  ) returning id into v_payment_id;

  update public.rent_charges
  set amount_paid = v_new_paid,
      status = case when v_new_paid >= v_charge.amount then 'paid' else 'partially_paid' end,
      updated_at = now()
  where id = v_charge.id and organization_id = p_organization_id;

  return v_payment_id;
end;
$function$;
revoke all on function public.record_cash_rent_payment(uuid,uuid,numeric,text,text) from public, anon;
grant execute on function public.record_cash_rent_payment(uuid,uuid,numeric,text,text) to authenticated;
