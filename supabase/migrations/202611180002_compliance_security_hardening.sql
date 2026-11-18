-- Defense-in-depth for provider credential submissions.
-- Preserve existing reviewer history in a staff-only table before removing
-- staff-only fields from provider-readable verification rows.

create table public.worker_verification_reviews (
  id uuid primary key default gen_random_uuid(),
  verification_id uuid not null references public.worker_verifications(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete restrict,
  decision text not null check (decision in ('pending', 'approved', 'rejected', 'suspended', 'expired')),
  internal_note text check (internal_note is null or char_length(internal_note) <= 1000),
  created_at timestamptz not null default now()
);
create index worker_verification_reviews_record_created_idx
  on public.worker_verification_reviews (verification_id, created_at desc);
alter table public.worker_verification_reviews enable row level security;
grant select on public.worker_verification_reviews to authenticated;
create policy "worker_verification_reviews_admin_read" on public.worker_verification_reviews
  for select to authenticated using (public.is_compliance_admin());

insert into public.worker_verification_reviews
  (verification_id, reviewer_id, decision, internal_note, created_at)
select id, reviewer_id, status, reviewer_note, coalesce(reviewed_at, created_at)
from public.worker_verifications
where reviewer_id is not null
on conflict do nothing;

drop policy if exists "worker_verifications_review_admin" on public.worker_verifications;
revoke all on public.worker_verifications from authenticated;
grant select on public.worker_verifications to authenticated;
grant insert (provider_id, kind, issuing_authority, credential_name, credential_number, scope, expires_on, evidence_reference, evidence_path)
  on public.worker_verifications to authenticated;

do $$
declare
  item record;
begin
  for item in
    select conname from pg_catalog.pg_constraint
    where conrelid = 'public.worker_verifications'::regclass
      and position('reviewer_id' in pg_catalog.pg_get_constraintdef(oid)) > 0
  loop
    execute format('alter table public.worker_verifications drop constraint %I', item.conname);
  end loop;
end;
$$;

alter table public.worker_verifications drop column if exists reviewer_note;
alter table public.worker_verifications drop column if exists reviewer_id;
alter table public.worker_verifications
  add constraint worker_verifications_reviewed_at_check
  check (status = 'pending' or reviewed_at is not null);

drop policy if exists "worker_verifications_submit_owner" on public.worker_verifications;
create policy "worker_verifications_submit_owner" on public.worker_verifications
  for insert to authenticated with check (
    provider_id = (select auth.uid())
    and kind in ('qualification', 'professional_licence', 'reference')
    and status = 'pending' and reviewed_at is null
    and (evidence_path is null or evidence_path like (provider_id::text || '/' || kind || '/%'))
    and exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'provider')
  );

drop policy if exists "verification_evidence_insert_provider" on storage.objects;
create policy "verification_evidence_insert_provider" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'doorstep-verification-evidence'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and (storage.foldername(name))[2] in ('qualification', 'professional_licence', 'reference')
    and exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'provider')
  );

create or replace function public.review_worker_verification(
  p_verification_id uuid,
  p_status text,
  p_internal_note text default null,
  p_provider_message text default null
)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  item public.worker_verifications%rowtype;
begin
  if not public.is_compliance_admin() then
    raise exception 'administrator access required';
  end if;
  if p_status not in ('approved', 'rejected', 'suspended', 'expired') then
    raise exception 'invalid review decision';
  end if;

  select * into item from public.worker_verifications
  where id = p_verification_id for update;
  if not found then raise exception 'verification not found'; end if;

  if p_status = 'approved' and (
    item.kind = 'identity'
    or item.credential_name = ''
    or item.issuing_authority = ''
    or (item.kind <> 'reference' and (
      item.evidence_path is null
      or item.evidence_path not like (item.provider_id::text || '/' || item.kind || '/%')
      or not exists (select 1 from storage.objects o
        where o.bucket_id = 'doorstep-verification-evidence' and o.name = item.evidence_path)
    ))
    or (item.expires_on is not null and item.expires_on < current_date)
  ) then
    raise exception 'required credential evidence is missing, mismatched, or expired';
  end if;

  update public.worker_verifications
  set status = p_status,
      reviewed_at = now(),
      provider_message = nullif(left(trim(coalesce(p_provider_message, '')), 1000), ''),
      updated_at = now()
  where id = p_verification_id;

  insert into public.worker_verification_reviews
    (verification_id, reviewer_id, decision, internal_note)
  values (
    p_verification_id, (select auth.uid()), p_status,
    nullif(left(trim(coalesce(p_internal_note, '')), 1000), '')
  );
end;
$$;
revoke all on function public.review_worker_verification(uuid, text, text, text) from public;
grant execute on function public.review_worker_verification(uuid, text, text, text) to authenticated;
