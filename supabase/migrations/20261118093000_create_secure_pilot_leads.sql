create table if not exists public.pilot_leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  email_normalized text not null unique,
  consent_at timestamptz not null,
  consent_version text not null,
  source text not null default 'website' check (source = 'website'),
  created_at timestamptz not null default now(),
  constraint pilot_leads_email_length check (char_length(email) between 3 and 254),
  constraint pilot_leads_email_normalized check (email_normalized = lower(btrim(email_normalized)))
);

alter table public.pilot_leads enable row level security;

-- Public visitors cannot read or write this table directly. The API route
-- verifies Cloudflare Turnstile and inserts using a server-only Supabase key.
revoke all on table public.pilot_leads from public, anon, authenticated;
grant insert on table public.pilot_leads to service_role;
