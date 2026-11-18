-- Create leases and claim units in one transaction with workspace authorization.
create or replace function public.create_lease_for_current_user(
  p_organization_id uuid,
  p_unit_id uuid,
  p_tenant_id uuid,
  p_start_date date,
  p_monthly_rent numeric,
  p_rent_due_day integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_unit public.units%rowtype;
  v_lease_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if not private.is_org_staff(p_organization_id) then
    raise exception 'Workspace access denied' using errcode = '42501';
  end if;
  if p_monthly_rent is null or p_monthly_rent <= 0
     or p_rent_due_day is null or p_rent_due_day < 1 or p_rent_due_day > 28
     or p_start_date is null then
    raise exception 'Invalid lease details' using errcode = '22023';
  end if;
  select * into v_unit
  from public.units
  where id = p_unit_id
    and organization_id = p_organization_id
  for update;
  if not found or v_unit.status <> 'vacant' then
    raise exception 'Unit is not available' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.tenants
    where id = p_tenant_id and organization_id = p_organization_id
  ) then
    raise exception 'Tenant not found in this workspace' using errcode = '22023';
  end if;
  insert into public.leases (
    organization_id, unit_id, tenant_id, start_date, monthly_rent, rent_due_day, status
  ) values (
    p_organization_id, p_unit_id, p_tenant_id, p_start_date, p_monthly_rent, p_rent_due_day, 'active'
  ) returning id into v_lease_id;
  update public.units
  set status = 'occupied', updated_at = now()
  where id = p_unit_id and organization_id = p_organization_id;
  return v_lease_id;
end;
$function$;

revoke all on function public.create_lease_for_current_user(uuid,uuid,uuid,date,numeric,integer) from public, anon;
grant execute on function public.create_lease_for_current_user(uuid,uuid,uuid,date,numeric,integer) to authenticated;

-- Prevent two concurrent STK prompts for the same rent charge.
create unique index if not exists payments_one_pending_mpesa_per_charge
on public.payments (rent_charge_id)
where method = 'mpesa' and status = 'pending';
