create unique index if not exists payments_manual_reference_unique_idx
on public.payments(organization_id,method,provider_reference)
where status='confirmed' and provider_reference is not null and method in ('bank','cash','card','check','other');

create or replace function private.log_workspace_activity()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
 v_org_id uuid;
 v_entity_id uuid;
 v_data jsonb;
 v_summary text;
 v_action text:=lower(TG_OP);
begin
 if TG_OP='DELETE' then
  v_org_id:=OLD.organization_id; v_entity_id:=OLD.id; v_data:=to_jsonb(OLD);
 else
  v_org_id:=NEW.organization_id; v_entity_id:=NEW.id; v_data:=to_jsonb(NEW);
 end if;
 v_summary:=case TG_ARGV[0]
  when 'properties' then 'Property '||coalesce(v_data->>'name','record')||' '||v_action
  when 'units' then 'Unit '||coalesce(v_data->>'unit_number','record')||' '||v_action
  when 'tenants' then 'Tenant record '||v_action
  when 'leases' then 'Lease '||coalesce(v_data->>'status','record')||' '||v_action||case when v_data ? 'monthly_rent' then ' · KES '||coalesce(v_data->>'monthly_rent','0') else '' end
  when 'rent' then 'Rent charge '||coalesce(v_data->>'billing_period','')||' '||v_action||' · '||coalesce(v_data->>'status','')||' · KES '||coalesce(v_data->>'amount','0')
  when 'payments' then case when TG_ARGV[1]='Payment instructions' then 'Payment instructions '||v_action||' · '||coalesce(v_data->>'label','') else 'Payment '||v_action||' · '||coalesce(v_data->>'method','')||' · '||coalesce(v_data->>'status','')||' · KES '||coalesce(v_data->>'amount','0') end
  when 'maintenance' then 'Repair '||coalesce(v_data->>'title','record')||' '||v_action||' · '||coalesce(v_data->>'status','')
  when 'concerns' then 'Concern '||coalesce(v_data->>'category','')||' '||v_action||' · '||coalesce(v_data->>'priority','')||' · '||coalesce(v_data->>'status','')
  else TG_ARGV[1]||' '||v_action
 end;
 insert into public.workspace_activity_logs(organization_id,category,entity_id,action,summary,actor_user_id)
 values(v_org_id,TG_ARGV[0],v_entity_id,v_action,left(v_summary,240),auth.uid());
 if TG_OP='DELETE' then return OLD; end if;
 return NEW;
end;
$$;
revoke all on function private.log_workspace_activity() from public,anon,authenticated;
