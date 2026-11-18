-- Compliance foundations for a marketplace operating in Kenya.
-- Categories remain unpublishable until a compliance administrator records a review.

create table public.compliance_admins (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.compliance_admins enable row level security;
revoke all on public.compliance_admins from anon, authenticated;

create or replace function public.is_compliance_admin()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.compliance_admins where user_id = (select auth.uid()));
$$;
revoke all on function public.is_compliance_admin() from public;
grant execute on function public.is_compliance_admin() to anon, authenticated;

create table public.category_compliance (
  category_id uuid primary key references public.categories(id) on delete cascade,
  state text not null default 'pending' check (state in ('pending', 'approved', 'blocked')),
  required_verification_kinds text[] not null default '{}',
  review_reference text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  updated_at timestamptz not null default now(),
  check (required_verification_kinds <@ array['identity', 'qualification', 'professional_licence', 'reference']::text[]),
  check (
    (state = 'pending' and reviewed_by is null and reviewed_at is null)
    or (state <> 'pending' and reviewed_by is not null and reviewed_at is not null
      and review_reference is not null and char_length(trim(review_reference)) > 0)
  )
);
insert into public.category_compliance (category_id)
select id from public.categories on conflict (category_id) do nothing;
create or replace function public.seed_category_compliance()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.category_compliance (category_id) values (new.id)
  on conflict (category_id) do nothing;
  return new;
end;
$$;
revoke all on function public.seed_category_compliance() from public;
create trigger categories_seed_compliance
  after insert on public.categories
  for each row execute procedure public.seed_category_compliance();
alter table public.category_compliance enable row level security;
grant select on public.category_compliance to anon, authenticated;
grant update (state, required_verification_kinds, review_reference, reviewed_by, reviewed_at, updated_at)
  on public.category_compliance to authenticated;
create policy "category_compliance_read_approved" on public.category_compliance
  for select to anon, authenticated using (
    state = 'approved' or public.is_compliance_admin()
    or exists (select 1 from public.provider_profiles p
      where p.profile_id = (select auth.uid()) and p.category_id = category_compliance.category_id)
  );
create policy "category_compliance_update_admin" on public.category_compliance
  for update to authenticated using (public.is_compliance_admin())
  with check (
    public.is_compliance_admin()
    and ((state = 'pending' and reviewed_by is null and reviewed_at is null)
      or (state <> 'pending' and reviewed_by = (select auth.uid())))
  );

create table public.worker_verifications (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.provider_profiles(profile_id) on delete cascade,
  kind text not null check (kind in ('identity', 'qualification', 'professional_licence', 'reference')),
  issuing_authority text not null default '' check (char_length(issuing_authority) <= 200),
  credential_name text not null default '' check (char_length(credential_name) <= 200),
  credential_number text check (credential_number is null or char_length(credential_number) <= 120),
  scope text not null default '' check (char_length(scope) <= 500),
  expires_on date,
  evidence_path text,
  evidence_reference text check (evidence_reference is null or char_length(evidence_reference) <= 240),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'suspended', 'expired')),
  reviewer_id uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  reviewer_note text check (reviewer_note is null or char_length(reviewer_note) <= 1000),
  provider_message text check (provider_message is null or char_length(provider_message) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status = 'pending' or (reviewer_id is not null and reviewed_at is not null)),
  check (evidence_path is null or evidence_path like (provider_id::text || '/%'))
);
create index worker_verifications_provider_status_idx on public.worker_verifications (provider_id, status, kind);
create index worker_verifications_expiry_idx on public.worker_verifications (expires_on) where status = 'approved';
alter table public.worker_verifications enable row level security;
grant select on public.worker_verifications to authenticated;
grant insert (provider_id, kind, issuing_authority, credential_name, credential_number, scope, expires_on, evidence_reference, evidence_path)
  on public.worker_verifications to authenticated;
grant update (status, reviewer_id, reviewed_at, reviewer_note, provider_message, updated_at) on public.worker_verifications to authenticated;
create policy "worker_verifications_read_owner_admin" on public.worker_verifications
  for select to authenticated using (provider_id = (select auth.uid()) or public.is_compliance_admin());
create policy "worker_verifications_submit_owner" on public.worker_verifications
  for insert to authenticated with check (
    provider_id = (select auth.uid()) and status = 'pending' and reviewer_id is null and reviewed_at is null
    and exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'provider')
  );
create policy "worker_verifications_review_admin" on public.worker_verifications
  for update to authenticated using (public.is_compliance_admin())
  with check (public.is_compliance_admin() and reviewer_id = (select auth.uid()));

-- Licence and qualification evidence is private. The application deliberately
-- does not accept identity-document or biometric uploads in this release.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('doorstep-verification-evidence', 'doorstep-verification-evidence', false, 10485760,
  array['application/pdf', 'image/jpeg', 'image/png']::text[])
on conflict (id) do update set public = false, file_size_limit = 10485760,
  allowed_mime_types = array['application/pdf', 'image/jpeg', 'image/png']::text[];
create policy "verification_evidence_read_owner_admin" on storage.objects
  for select to authenticated using (
    bucket_id = 'doorstep-verification-evidence'
    and ((storage.foldername(name))[1] = (select auth.uid()::text) or public.is_compliance_admin())
  );
create policy "verification_evidence_insert_provider" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'doorstep-verification-evidence'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'provider')
  );
create policy "verification_evidence_delete_pending_admin" on storage.objects
  for delete to authenticated using (
    bucket_id = 'doorstep-verification-evidence'
    and (public.is_compliance_admin() or (
      (storage.foldername(name))[1] = (select auth.uid()::text)
      and exists (select 1 from public.worker_verifications v
        where v.provider_id = (select auth.uid()) and v.evidence_path = name and v.status = 'pending')
    ))
  );

create or replace function public.category_is_launch_approved(p_category_id uuid, p_provider_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.category_compliance cc
    where cc.category_id = p_category_id and cc.state = 'approved'
      and not exists (
        select 1 from unnest(cc.required_verification_kinds) required(kind)
        where not exists (
          select 1 from public.worker_verifications v
          where v.provider_id = p_provider_id
            and v.kind = required.kind and v.status = 'approved'
            and (v.expires_on is null or v.expires_on >= current_date)
            and v.credential_name <> '' and v.issuing_authority <> ''
            and (required.kind = 'reference' or v.evidence_path is not null)
        )
      )
  );
$$;
-- No category is approved by this migration. Category state and provider-specific
-- current credentials are both checked before public publication.
revoke all on function public.category_is_launch_approved(uuid, uuid) from public;
grant execute on function public.category_is_launch_approved(uuid, uuid) to anon, authenticated;

create table public.privacy_requests (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.profiles(id) on delete cascade,
  request_kind text not null check (request_kind in ('access', 'correction', 'objection', 'restriction', 'portability', 'erasure', 'other')),
  details text not null default '' check (char_length(details) <= 1200),
  status text not null default 'received' check (status in ('received', 'in_review', 'fulfilled', 'declined', 'needs_information')),
  response_note text check (response_note is null or char_length(response_note) <= 1200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  handled_by uuid references public.profiles(id) on delete set null,
  handled_at timestamptz
);
create index privacy_requests_subject_created_idx on public.privacy_requests (subject_id, created_at desc);
alter table public.privacy_requests enable row level security;
grant select, insert on public.privacy_requests to authenticated;
grant update (status, response_note, updated_at, handled_by, handled_at) on public.privacy_requests to authenticated;
create policy "privacy_requests_read_owner_admin" on public.privacy_requests
  for select to authenticated using (subject_id = (select auth.uid()) or public.is_compliance_admin());
create policy "privacy_requests_insert_own" on public.privacy_requests
  for insert to authenticated with check (subject_id = (select auth.uid()) and status = 'received' and handled_by is null);
create policy "privacy_requests_handle_admin" on public.privacy_requests
  for update to authenticated using (public.is_compliance_admin())
  with check (public.is_compliance_admin() and handled_by = (select auth.uid()));

create table public.trust_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete set null,
  report_kind text not null check (report_kind in ('safety', 'harassment', 'service_complaint', 'payment_concern', 'other')),
  description text not null check (char_length(description) between 10 and 3000),
  status text not null default 'received' check (status in ('received', 'in_review', 'resolved', 'referred', 'closed')),
  response_note text check (response_note is null or char_length(response_note) <= 1200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  handled_by uuid references public.profiles(id) on delete set null,
  handled_at timestamptz
);
create index trust_reports_reporter_created_idx on public.trust_reports (reporter_id, created_at desc);
alter table public.trust_reports enable row level security;
grant select, insert on public.trust_reports to authenticated;
grant update (status, response_note, updated_at, handled_by, handled_at) on public.trust_reports to authenticated;
create policy "trust_reports_read_reporter_admin" on public.trust_reports
  for select to authenticated using (reporter_id = (select auth.uid()) or public.is_compliance_admin());
create policy "trust_reports_insert_participant" on public.trust_reports
  for insert to authenticated with check (
    reporter_id = (select auth.uid()) and status = 'received' and handled_by is null
    and (booking_id is null or exists (
      select 1 from public.bookings b where b.id = trust_reports.booking_id
        and (b.customer_id = (select auth.uid()) or b.provider_id = (select auth.uid()))
    ))
  );
create policy "trust_reports_handle_admin" on public.trust_reports
  for update to authenticated using (public.is_compliance_admin())
  with check (public.is_compliance_admin() and handled_by = (select auth.uid()));

create table public.compliance_audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  event_kind text not null,
  record_id uuid not null,
  from_state text,
  to_state text,
  created_at timestamptz not null default now()
);
alter table public.compliance_audit_events enable row level security;
grant select on public.compliance_audit_events to authenticated;
create policy "compliance_audit_read_admin" on public.compliance_audit_events
  for select to authenticated using (public.is_compliance_admin());

create or replace function public.record_verification_document_access(p_verification_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_compliance_admin() then
    raise exception 'administrator access required';
  end if;
  insert into public.compliance_audit_events (actor_id, event_kind, record_id, to_state)
  values ((select auth.uid()), 'verification_document_view', p_verification_id, 'viewed');
end;
$$;
revoke all on function public.record_verification_document_access(uuid) from public;
grant execute on function public.record_verification_document_access(uuid) to authenticated;

create or replace function public.log_compliance_state_change()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if old.status is distinct from new.status then
    insert into public.compliance_audit_events (actor_id, event_kind, record_id, from_state, to_state)
    values ((select auth.uid()), tg_table_name, new.id, old.status, new.status);
  end if;
  return new;
end;
$$;
create trigger worker_verifications_audit_state after update on public.worker_verifications
  for each row execute procedure public.log_compliance_state_change();
create trigger privacy_requests_audit_state after update on public.privacy_requests
  for each row execute procedure public.log_compliance_state_change();
create trigger trust_reports_audit_state after update on public.trust_reports
  for each row execute procedure public.log_compliance_state_change();

create or replace function public.log_category_compliance_change()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if old.state is distinct from new.state
    or old.required_verification_kinds is distinct from new.required_verification_kinds
    or old.review_reference is distinct from new.review_reference then
    insert into public.compliance_audit_events (actor_id, event_kind, record_id, from_state, to_state)
    values ((select auth.uid()), 'category_review', new.category_id, old.state, new.state);
  end if;
  return new;
end;
$$;
create trigger category_compliance_audit_state after update on public.category_compliance
  for each row execute procedure public.log_category_compliance_change();

drop policy if exists "services_read_active" on public.services;
create policy "services_read_active" on public.services
  for select to anon, authenticated using (
    active and exists (
      select 1 from public.provider_profiles p
      where p.profile_id = provider_id and not p.paused
        and public.category_is_launch_approved(p.category_id, p.profile_id)
    )
  );

drop policy if exists "provider_profiles_read_published" on public.provider_profiles;
create policy "provider_profiles_read_published" on public.provider_profiles
  for select to anon, authenticated using (
    not paused and public.category_is_launch_approved(category_id, profile_id)
  );

drop policy if exists "portfolio_read_published" on public.portfolio_items;
create policy "portfolio_read_published" on public.portfolio_items
  for select to anon, authenticated using (
    exists (select 1 from public.provider_profiles p
      where p.profile_id = provider_id and not p.paused
        and public.category_is_launch_approved(p.category_id, p.profile_id))
  );

drop policy if exists "portfolio_storage_read_published" on storage.objects;
create policy "portfolio_storage_read_published" on storage.objects
  for select to anon, authenticated using (
    bucket_id = 'doorstep-provider-portfolio'
    and exists (select 1 from public.provider_profiles p
      where p.profile_id::text = (storage.foldername(name))[1] and not p.paused
        and public.category_is_launch_approved(p.category_id, p.profile_id))
  );

drop policy if exists "availability_read_open" on public.availability;
create policy "availability_read_open" on public.availability
  for select to anon, authenticated using (
    is_open and exists (select 1 from public.provider_profiles p
      where p.profile_id = provider_id and not p.paused
        and public.category_is_launch_approved(p.category_id, p.profile_id))
  );
drop policy if exists "services_insert_own" on public.services;
create policy "services_insert_own" on public.services
  for insert to authenticated with check (
    provider_id = (select auth.uid())
    and exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'provider')
    and (not active or exists (
      select 1 from public.provider_profiles p
      where p.profile_id = provider_id and public.category_is_launch_approved(p.category_id, p.profile_id)
    ))
  );
drop policy if exists "services_update_own" on public.services;
create policy "services_update_own" on public.services
  for update to authenticated using (
    provider_id = (select auth.uid())
    and exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'provider')
  ) with check (
    provider_id = (select auth.uid())
    and exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'provider')
    and (not active or exists (
      select 1 from public.provider_profiles p
      where p.profile_id = provider_id and public.category_is_launch_approved(p.category_id, p.profile_id)
    ))
  );

-- Apply the same gate inside the write path: a client cannot bypass public
-- listing visibility by inserting a booking against a known service UUID.
drop policy if exists "bookings_insert_customer" on public.bookings;
create policy "bookings_insert_customer" on public.bookings
  for insert to authenticated with check (
    customer_id = (select auth.uid())
    and preferred_at > now()
    and exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'customer')
    and exists (
      select 1 from public.services s
      join public.provider_profiles p on p.profile_id = s.provider_id
      where s.id = public.bookings.service_id
        and s.provider_id = public.bookings.provider_id
        and s.active and not p.paused
        and public.category_is_launch_approved(p.category_id, p.profile_id)
    )
  );

-- Credentials may expire after a request was created. Recheck the category and
-- current provider requirements at the moment a job or quote is accepted.
create or replace function public.enforce_booking_provider_compliance()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if new.status = 'accepted' and old.status in ('pending', 'proposed') then
    if not exists (
      select 1 from public.provider_profiles p
      where p.profile_id = new.provider_id and not p.paused
        and public.category_is_launch_approved(p.category_id, p.profile_id)
    ) then
      raise exception 'Provider category review or required credentials are not current';
    end if;
  end if;
  return new;
end;
$$;
create trigger bookings_require_current_provider_compliance
  before update of status on public.bookings
  for each row execute procedure public.enforce_booking_provider_compliance();

update public.provider_profiles set verified = false where verified;

create or replace function public.set_booking_customer_display_name()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  select coalesce(nullif(split_part(trim(p.full_name), ' ', 1), ''), 'Customer')
    into new.customer_display_name
    from public.profiles p where p.id = new.customer_id;
  return new;
end;
$$;
update public.bookings b
set customer_display_name = coalesce(nullif(split_part(trim(p.full_name), ' ', 1), ''), 'Customer')
from public.profiles p where p.id = b.customer_id;
