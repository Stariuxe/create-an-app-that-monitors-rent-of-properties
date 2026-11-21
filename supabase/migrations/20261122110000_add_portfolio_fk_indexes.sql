-- Cover remaining foreign keys identified by the Supabase performance advisor.
-- These indexes improve joins and FK delete/update checks without changing access rules.
create index if not exists payment_collection_methods_created_by_idx
  on public.payment_collection_methods (created_by);

create index if not exists property_portfolio_records_created_by_idx
  on public.property_portfolio_records (created_by);

create index if not exists property_portfolio_records_property_id_idx
  on public.property_portfolio_records (property_id);
