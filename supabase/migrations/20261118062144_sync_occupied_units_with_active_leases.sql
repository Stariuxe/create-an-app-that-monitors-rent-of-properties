-- Keep unit availability consistent with existing active leases.
update public.units u
set status = 'occupied'
where u.status = 'vacant'
  and exists (
    select 1
    from public.leases l
    where l.unit_id = u.id
      and l.organization_id = u.organization_id
      and l.status = 'active'
  );
