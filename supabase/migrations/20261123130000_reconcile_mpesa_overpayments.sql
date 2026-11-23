-- Reconcile real Daraja receipts even when another payment settles the charge first.
-- Any amount above the remaining rent balance is preserved as tenant credit.
create table if not exists public.tenant_payment_credits (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  tenant_id uuid not null,
  source_payment_id uuid not null unique references public.payments(id) on delete restrict,
  amount numeric(12,2) not null check (amount > 0),
  currency character(3) not null default 'KES' check (currency = 'KES'),
  status text not null default 'available' check (status in ('available','applied','refunded')),
  notes text,
  created_at timestamptz not null default now(),
  constraint tenant_payment_credits_tenant_org_fk
    foreign key (tenant_id, organization_id)
    references public.tenants(id, organization_id)
);

create index if not exists tenant_payment_credits_tenant_status_idx
  on public.tenant_payment_credits (tenant_id, status, created_at desc);

-- A Daraja receipt may only settle one M-Pesa payment, even across different STK checkouts.
create unique index if not exists payments_mpesa_receipt_unique_idx
  on public.payments(provider_reference)
  where method = 'mpesa' and status = 'confirmed' and provider_reference is not null;

alter table public.tenant_payment_credits enable row level security;
revoke all on table public.tenant_payment_credits from public, anon, authenticated;
grant all on table public.tenant_payment_credits to service_role;
grant select on table public.tenant_payment_credits to authenticated;
create policy "Staff view tenant payment credits"
  on public.tenant_payment_credits
  for select to authenticated
  using (private.is_org_staff(organization_id));

create or replace function public.confirm_mpesa_sandbox_payment(
  p_checkout_id text,
  p_receipt text,
  p_paid_amount numeric
)
returns text
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
as $function$
declare
  v_payment public.payments%rowtype;
  v_charge public.rent_charges%rowtype;
  v_remaining numeric;
  v_allocated numeric;
  v_credit numeric;
begin
  select * into v_payment
  from public.payments
  where provider_checkout_id = p_checkout_id
    and method = 'mpesa'
  for update;

  if not found then
    return 'unmatched';
  end if;

  if v_payment.status <> 'pending' then
    return 'duplicate';
  end if;

  -- Never mark a receipt failed merely because its amount differs from the STK request.
  -- A positive, receipted Daraja callback represents funds received and must be reconciled.
  if p_paid_amount is null or p_paid_amount <= 0
     or p_receipt is null or length(btrim(p_receipt)) = 0 then
    return 'invalid_receipt';
  end if;

  select * into v_charge
  from public.rent_charges
  where id = v_payment.rent_charge_id
    and organization_id = v_payment.organization_id
  for update;

  if not found then
    raise exception 'Rent charge not found for M-Pesa payment';
  end if;

  v_remaining := greatest(v_charge.amount - v_charge.amount_paid, 0);
  v_allocated := least(p_paid_amount, v_remaining);
  v_credit := p_paid_amount - v_allocated;

  update public.payments
  set amount = p_paid_amount,
      status = 'confirmed',
      provider_reference = btrim(p_receipt),
      paid_at = now(),
      notes = case
        when p_paid_amount <> v_payment.amount and v_credit > 0
          then 'Daraja receipt confirmed; amount differed from STK request. Excess preserved as tenant credit.'
        when p_paid_amount <> v_payment.amount
          then 'Daraja receipt confirmed; amount differed from STK request and was reconciled to outstanding rent.'
        when v_credit > 0
          then 'Daraja receipt confirmed after rent charge was already settled; excess preserved as tenant credit.'
        else 'Daraja sandbox callback verified.'
      end
  where id = v_payment.id;

  if v_allocated > 0 then
    update public.rent_charges
    set amount_paid = amount_paid + v_allocated,
        status = case when amount_paid + v_allocated >= amount then 'paid' else 'partially_paid' end,
        updated_at = now()
    where id = v_charge.id;
  end if;

  if v_credit > 0 then
    insert into public.tenant_payment_credits
      (organization_id, tenant_id, source_payment_id, amount, notes)
    values
      (v_payment.organization_id, v_payment.tenant_id, v_payment.id, v_credit,
       'Unallocated balance from confirmed Daraja receipt; requires landlord reconciliation.');
  end if;

  if v_credit > 0 then
    return 'confirmed_with_credit';
  end if;
  return 'confirmed';
exception
  when unique_violation then
    -- The same Daraja receipt was already applied to another payment.
    -- Roll back this callback's updates and leave it for manual reconciliation.
    return 'receipt_conflict';
end;
$function$;

revoke all on function public.confirm_mpesa_sandbox_payment(text, text, numeric) from public, anon, authenticated;
grant execute on function public.confirm_mpesa_sandbox_payment(text, text, numeric) to service_role;
