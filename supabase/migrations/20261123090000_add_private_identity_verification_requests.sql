-- Private identity evidence and provider verification tracking.
-- User accounts can only create pending requests; only trusted server-side review
-- should ever change a request to verified/rejected.
create table if not exists public.identity_verification_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  method text not null check (method in ('document_upload', 'korapay')),
  document_type text not null check (document_type in ('national_id', 'passport')),
  status text not null default 'pending' check (status in ('pending', 'verified', 'rejected', 'needs_review')),
  document_path text,
  provider_reference text,
  masked_document text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint identity_verification_method_payload_check check (
    (method = 'document_upload' and document_path is not null and provider_reference is null)
    or (method = 'korapay' and document_path is null)
  )
);
create index if not exists identity_verification_requests_user_created_idx
  on public.identity_verification_requests (user_id, created_at desc);
alter table public.identity_verification_requests enable row level security;
drop policy if exists "Users can view their own identity verification requests" on public.identity_verification_requests;
create policy "Users can view their own identity verification requests"
  on public.identity_verification_requests for select to authenticated
  using (user_id = (select auth.uid()));
drop policy if exists "Users can create their own identity verification requests" on public.identity_verification_requests;
create policy "Users can create their own identity verification requests"
  on public.identity_verification_requests for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'pending');
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('identity-documents', 'identity-documents', false, 5242880, array['image/jpeg', 'image/png', 'application/pdf'])
on conflict (id) do update set public = false, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg', 'image/png', 'application/pdf'];
drop policy if exists "Users upload their own identity documents" on storage.objects;
create policy "Users upload their own identity documents"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'identity-documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "Users view their own identity documents" on storage.objects;
create policy "Users view their own identity documents"
  on storage.objects for select to authenticated
  using (bucket_id = 'identity-documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
