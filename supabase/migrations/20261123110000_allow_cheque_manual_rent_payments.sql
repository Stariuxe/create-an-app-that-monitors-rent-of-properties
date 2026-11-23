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
