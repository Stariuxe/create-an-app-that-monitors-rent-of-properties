create policy "Tenants view units on their active leases" on public.units
for select to authenticated using (
 exists (
  select 1 from public.leases l join public.tenants t on t.id=l.tenant_id and t.organization_id=l.organization_id
  where l.unit_id=units.id and l.organization_id=units.organization_id and l.status='active' and t.auth_user_id=(select auth.uid())
 )
);
create policy "Tenants view properties on their active leases" on public.properties
for select to authenticated using (
 exists (
  select 1 from public.units u join public.leases l on l.unit_id=u.id and l.organization_id=u.organization_id
  join public.tenants t on t.id=l.tenant_id and t.organization_id=l.organization_id
  where u.property_id=properties.id and u.organization_id=properties.organization_id and l.status='active' and t.auth_user_id=(select auth.uid())
 )
);
