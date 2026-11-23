create index if not exists property_concerns_created_by_idx on public.property_concerns(created_by);
create index if not exists property_concerns_property_org_idx on public.property_concerns(property_id,organization_id);
create index if not exists property_concerns_responded_by_idx on public.property_concerns(responded_by);
create index if not exists property_concerns_tenant_org_idx on public.property_concerns(tenant_id,organization_id);
create index if not exists property_concerns_unit_org_idx on public.property_concerns(unit_id,organization_id);
create index if not exists property_payment_instructions_created_by_idx on public.property_payment_instructions(created_by);
create index if not exists property_payment_instructions_org_idx on public.property_payment_instructions(organization_id);
create index if not exists workspace_activity_logs_actor_user_idx on public.workspace_activity_logs(actor_user_id);
