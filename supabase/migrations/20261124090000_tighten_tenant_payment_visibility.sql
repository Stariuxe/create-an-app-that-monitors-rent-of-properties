-- Restrict tenant-visible payment rows to a rent charge on that same tenant's lease.
-- This migration changes only the SELECT policy; it does not modify payment records.
drop policy if exists "Tenants view their own payments" on public.payments;

create policy "Tenants view their own payments"
on public.payments
for select
to authenticated
using (
  exists (
    select 1
    from public.tenants t
    join public.leases l
      on l.tenant_id = t.id
     and l.organization_id = t.organization_id
    join public.rent_charges rc
      on rc.lease_id = l.id
     and rc.organization_id = l.organization_id
    where t.id = payments.tenant_id
      and t.organization_id = payments.organization_id
      and t.auth_user_id = (select auth.uid())
      and rc.id = payments.rent_charge_id
  )
);
