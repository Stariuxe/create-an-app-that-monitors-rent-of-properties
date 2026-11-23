alter table public.payments drop constraint if exists payments_method_check;
alter table public.payments add constraint payments_method_check check (method = any (array['mpesa','bank','cash','card','check','other']::text[]));
alter table public.property_payment_instructions drop constraint if exists property_payment_instructions_method_check;
alter table public.property_payment_instructions add constraint property_payment_instructions_method_check check (method = any (array['mpesa','bank','cash','card','check','other']::text[]));
create policy "Tenants view active payment instructions" on public.property_payment_instructions
for select to authenticated using (
 is_active and exists (
  select 1 from public.tenants t join public.leases l on l.tenant_id=t.id and l.organization_id=t.organization_id
  where t.organization_id=property_payment_instructions.organization_id and t.auth_user_id=(select auth.uid()) and l.status='active'
 )
);
drop trigger if exists payment_instruction_activity_log on public.property_payment_instructions;
create trigger payment_instruction_activity_log after insert or update or delete on public.property_payment_instructions
for each row execute function private.log_workspace_activity('payments','Payment instructions');
