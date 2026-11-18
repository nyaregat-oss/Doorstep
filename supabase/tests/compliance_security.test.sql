-- Run with `supabase test db` after applying the migrations to a local test DB.
-- Fixtures and storage rows roll back at the end of this test.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(5);

create temporary table compliance_test_fixture (
  provider_id uuid not null,
  verification_id uuid not null
);
create temporary table compliance_test_results (
  test_name text primary key,
  passed boolean not null
);
grant select on compliance_test_fixture to authenticated;
grant select, insert on compliance_test_results to authenticated;

with new_user as (
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
  ) values (
    gen_random_uuid(), '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    gen_random_uuid()::text || '@compliance-test.invalid', 'test-hash',
    now(), '{"provider":"email"}'::jsonb,
    '{"role":"provider","full_name":"Test Provider","business_name":"Test Provider"}'::jsonb,
    now(), now()
  ) returning id
), new_verification as (
  insert into public.worker_verifications (provider_id, kind, issuing_authority, credential_name)
  select id, 'qualification', 'Test Authority', 'Test qualification' from new_user
  returning id, provider_id
), new_review as (
  insert into public.worker_verification_reviews
    (verification_id, reviewer_id, decision, internal_note)
  select id, provider_id, 'rejected', 'Internal staff note' from new_verification
  returning verification_id
)
insert into compliance_test_fixture (provider_id, verification_id)
select provider_id, id from new_verification;

select set_config('request.jwt.claim.sub', (select provider_id::text from compliance_test_fixture), true);
set local role authenticated;

do $$
declare
  provider_id uuid;
  verification_count integer;
  identity_row_blocked boolean := false;
  identity_file_blocked boolean := false;
  allowed_record_inserted boolean := false;
begin
  select f.provider_id into provider_id from pg_temp.compliance_test_fixture f;

  select count(*) into verification_count from public.worker_verification_reviews;
  insert into pg_temp.compliance_test_results values ('internal_notes_hidden', verification_count = 0);

  insert into pg_temp.compliance_test_results
  select 'reviewer_note_not_on_provider_table', not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'worker_verifications'
      and column_name = 'reviewer_note'
  );

  begin
    insert into public.worker_verifications (provider_id, kind, credential_name, issuing_authority)
    values (provider_id, 'identity', 'Identity record', 'Test authority');
  exception when insufficient_privilege then
    identity_row_blocked := true;
  end;
  insert into pg_temp.compliance_test_results values ('identity_record_blocked', identity_row_blocked);

  begin
    insert into storage.objects (bucket_id, name)
    values ('doorstep-verification-evidence', provider_id::text || '/identity/document.jpg');
  exception when insufficient_privilege then
    identity_file_blocked := true;
  end;
  insert into pg_temp.compliance_test_results values ('identity_upload_blocked', identity_file_blocked);

  insert into public.worker_verifications (provider_id, kind, credential_name, issuing_authority)
  values (provider_id, 'qualification', 'Allowed test qualification', 'Test authority');
  allowed_record_inserted := true;
  insert into pg_temp.compliance_test_results values ('credential_submission_allowed', allowed_record_inserted);
end;
$$;

reset role;
select ok((select passed from compliance_test_results where test_name = 'internal_notes_hidden'), 'providers cannot read internal review notes');
select ok((select passed from compliance_test_results where test_name = 'reviewer_note_not_on_provider_table'), 'internal note column is absent from provider-readable records');
select ok((select passed from compliance_test_results where test_name = 'identity_record_blocked'), 'providers cannot insert identity-verification records');
select ok((select passed from compliance_test_results where test_name = 'identity_upload_blocked'), 'providers cannot upload into the identity evidence path');
select ok((select passed from compliance_test_results where test_name = 'credential_submission_allowed'), 'providers can still submit allowed credential records');
select * from finish();
rollback;
