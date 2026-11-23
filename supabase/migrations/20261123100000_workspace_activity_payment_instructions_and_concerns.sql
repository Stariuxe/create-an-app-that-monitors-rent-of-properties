create table if not exists public.property_payment_instructions (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 method text not null check (method in ('mpesa','bank','cash','card','other')),
 label text not null check (char_length(btrim(label)) between 2 and 100),
 beneficiary_name text, bank_name text, branch_name text, account_name text, account_number text,
 paybill_number text, till_number text, phone_number text, account_reference text, instructions text,
 is_active boolean not null default true, created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.property_payment_instructions enable row level security;
create policy "Staff manage payment instructions" on public.property_payment_instructions for all to authenticated
using (private.is_org_staff(organization_id)) with check (private.is_org_staff(organization_id));

create table if not exists public.property_concerns (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 property_id uuid not null, unit_id uuid, tenant_id uuid, created_by uuid references auth.users(id) on delete set null,
 category text not null check (category in ('maintenance','payment','safety','noise','neighbour','lease','facilities','other')),
 title text not null check (char_length(btrim(title)) between 3 and 160),
 description text not null check (char_length(btrim(description)) between 5 and 5000),
 priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
 status text not null default 'open' check (status in ('open','under_review','in_progress','resolved','closed')),
 landlord_response text, responded_by uuid references auth.users(id) on delete set null, responded_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 constraint property_concerns_property_org_fk foreign key (property_id, organization_id) references public.properties(id, organization_id) on delete cascade,
 constraint property_concerns_unit_org_fk foreign key (unit_id, organization_id) references public.units(id, organization_id),
 constraint property_concerns_tenant_org_fk foreign key (tenant_id, organization_id) references public.tenants(id, organization_id)
);
create index if not exists property_concerns_org_created_idx on public.property_concerns(organization_id, created_at desc);
create index if not exists property_concerns_tenant_created_idx on public.property_concerns(tenant_id, created_at desc);
alter table public.property_concerns enable row level security;
create policy "Staff manage property concerns" on public.property_concerns for all to authenticated
using (private.is_org_staff(organization_id)) with check (private.is_org_staff(organization_id));
create policy "Tenants view own property concerns" on public.property_concerns for select to authenticated
using (exists (select 1 from public.tenants t where t.id=property_concerns.tenant_id and t.organization_id=property_concerns.organization_id and t.auth_user_id=(select auth.uid())));
create policy "Tenants create own property concerns" on public.property_concerns for insert to authenticated
with check (tenant_id is not null and created_by=(select auth.uid()) and status='open' and exists (
 select 1 from public.tenants t join public.leases l on l.tenant_id=t.id and l.organization_id=t.organization_id
 where t.id=property_concerns.tenant_id and t.organization_id=property_concerns.organization_id
 and t.auth_user_id=(select auth.uid()) and l.status='active' and l.unit_id=property_concerns.unit_id
));

create table if not exists public.workspace_activity_logs (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 category text not null check (category in ('properties','units','tenants','leases','rent','payments','maintenance','concerns')),
 entity_id uuid, action text not null check (action in ('insert','update','delete')), summary text not null,
 actor_user_id uuid references auth.users(id) on delete set null, created_at timestamptz not null default now()
);
create index if not exists workspace_activity_logs_org_category_date_idx on public.workspace_activity_logs(organization_id,category,created_at desc);
alter table public.workspace_activity_logs enable row level security;
create policy "Staff view workspace activity logs" on public.workspace_activity_logs for select to authenticated using (private.is_org_staff(organization_id));

create or replace function private.log_workspace_activity() returns trigger language plpgsql security definer set search_path='' as $$
declare v_org_id uuid; v_entity_id uuid;
begin
 if TG_OP='DELETE' then v_org_id:=OLD.organization_id; v_entity_id:=OLD.id;
 else v_org_id:=NEW.organization_id; v_entity_id:=NEW.id; end if;
 insert into public.workspace_activity_logs(organization_id,category,entity_id,action,summary,actor_user_id)
 values(v_org_id,TG_ARGV[0],v_entity_id,lower(TG_OP),TG_ARGV[1]||' '||lower(TG_OP),auth.uid());
 if TG_OP='DELETE' then return OLD; end if; return NEW;
end; $$;
revoke all on function private.log_workspace_activity() from public,anon,authenticated;
drop trigger if exists property_activity_log on public.properties;
create trigger property_activity_log after insert or update or delete on public.properties for each row execute function private.log_workspace_activity('properties','Property');
drop trigger if exists unit_activity_log on public.units;
create trigger unit_activity_log after insert or update or delete on public.units for each row execute function private.log_workspace_activity('units','Unit');
drop trigger if exists tenant_activity_log on public.tenants;
create trigger tenant_activity_log after insert or update or delete on public.tenants for each row execute function private.log_workspace_activity('tenants','Tenant');
drop trigger if exists lease_activity_log on public.leases;
create trigger lease_activity_log after insert or update or delete on public.leases for each row execute function private.log_workspace_activity('leases','Lease');
drop trigger if exists rent_charge_activity_log on public.rent_charges;
create trigger rent_charge_activity_log after insert or update or delete on public.rent_charges for each row execute function private.log_workspace_activity('rent','Rent charge');
drop trigger if exists payment_activity_log on public.payments;
create trigger payment_activity_log after insert or update or delete on public.payments for each row execute function private.log_workspace_activity('payments','Payment');
drop trigger if exists maintenance_activity_log on public.maintenance_requests;
create trigger maintenance_activity_log after insert or update or delete on public.maintenance_requests for each row execute function private.log_workspace_activity('maintenance','Maintenance request');
drop trigger if exists concern_activity_log on public.property_concerns;
create trigger concern_activity_log after insert or update or delete on public.property_concerns for each row execute function private.log_workspace_activity('concerns','Concern');
create or replace function public.record_manual_rent_payment(
 p_organization_id uuid,p_rent_charge_id uuid,p_amount numeric,p_method text,p_reference text default null,
 p_received_from text default null,p_notes text default null,p_paid_at timestamptz default now()
) returns uuid language plpgsql set search_path='' as $$
declare v_user_id uuid:=(select auth.uid()); v_charge public.rent_charges%rowtype; v_tenant_id uuid;
 v_new_paid numeric; v_payment_id uuid; v_ref text:=nullif(btrim(p_reference),'');
begin
 if v_user_id is null then raise exception 'Authentication required' using errcode='28000'; end if;
 if not private.is_org_staff(p_organization_id) then raise exception 'Workspace access denied' using errcode='42501'; end if;
 if p_method not in ('bank','cash','card','check','other') then raise exception 'Unsupported manual payment method' using errcode='22023'; end if;
 if p_amount is null or p_amount<=0 or p_amount>999999999999 then raise exception 'Invalid payment amount' using errcode='22023'; end if;
 if length(coalesce(p_received_from,''))>120 or length(coalesce(p_notes,''))>1000 or length(coalesce(v_ref,''))>120 then raise exception 'Payment details too long' using errcode='22023'; end if;
 if p_paid_at is null or p_paid_at>now()+interval '5 minutes' then raise exception 'Invalid payment date' using errcode='22023'; end if;
 select * into v_charge from public.rent_charges where id=p_rent_charge_id and organization_id=p_organization_id for update;
 if not found then raise exception 'Rent charge not found' using errcode='P0002'; end if;
 if p_amount>(v_charge.amount-v_charge.amount_paid) then raise exception 'Payment exceeds outstanding balance' using errcode='22023'; end if;
 select l.tenant_id into v_tenant_id from public.leases l where l.id=v_charge.lease_id and l.organization_id=p_organization_id;
 if v_tenant_id is null then raise exception 'Tenant not found for rent charge' using errcode='P0002'; end if;
 if v_ref is not null and exists(select 1 from public.payments p where p.organization_id=p_organization_id and p.method=p_method and p.provider_reference=v_ref and p.status='confirmed') then
  raise exception 'Payment reference already recorded' using errcode='23505'; end if;
 v_new_paid:=v_charge.amount_paid+p_amount;
 insert into public.payments(organization_id,rent_charge_id,tenant_id,amount,currency,method,status,provider_reference,paid_at,recorded_by,notes)
 values(p_organization_id,p_rent_charge_id,v_tenant_id,p_amount,'KES',p_method,'confirmed',v_ref,p_paid_at,v_user_id,
 concat_ws(' · ',nullif(btrim(p_received_from),''),nullif(btrim(p_notes),''),'Manually recorded by landlord')) returning id into v_payment_id;
 update public.rent_charges set amount_paid=v_new_paid,status=case when v_new_paid>=v_charge.amount then 'paid' else 'partially_paid' end,updated_at=now()
 where id=v_charge.id and organization_id=p_organization_id;
 return v_payment_id;
end; $$;
revoke all on function public.record_manual_rent_payment(uuid,uuid,numeric,text,text,text,text,timestamptz) from public,anon;
grant execute on function public.record_manual_rent_payment(uuid,uuid,numeric,text,text,text,text,timestamptz) to authenticated;
