-- Foundation schema and role-isolation checks. Run after all migrations with
-- `supabase test db`; local Supabase is required to execute these assertions.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(14);

create temporary table phase2_auth_fixture (
  customer_id uuid not null,
  provider_id uuid not null,
  second_provider_id uuid not null
);
grant select on phase2_auth_fixture to authenticated;

with inserted_users as (
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
  ) values
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', gen_random_uuid()::text || '@phase2.invalid', 'test-hash', now(), '{"provider":"email"}'::jsonb, '{"role":"customer","full_name":"Phase Two Customer"}'::jsonb, now(), now()),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', gen_random_uuid()::text || '@phase2.invalid', 'test-hash', now(), '{"provider":"email"}'::jsonb, '{"role":"provider","full_name":"Phase Two Provider","business_name":"Phase Two Services","category":"Plumbing","location":"Nairobi"}'::jsonb, now(), now()),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', gen_random_uuid()::text || '@phase2.invalid', 'test-hash', now(), '{"provider":"email"}'::jsonb, '{"role":"provider","full_name":"Second Provider","business_name":"Second Services","category":"Plumbing","location":"Nairobi"}'::jsonb, now(), now())
  returning id, raw_user_meta_data ->> 'role' as account_role
)
insert into phase2_auth_fixture (customer_id, provider_id, second_provider_id)
select
  (select id from inserted_users where account_role = 'customer'),
  (select id from inserted_users where account_role = 'provider' order by id limit 1),
  (select id from inserted_users where account_role = 'provider' order by id desc limit 1);

-- Exercise the provider self-insert policy with a provider whose profile row
-- has been removed by the test as the migration owner.
delete from public.provider_profiles
where profile_id = (select second_provider_id from phase2_auth_fixture);

set local role anon;
select is((select count(*)::integer from public.categories), 16, 'anonymous users can read the 16 active seed categories');
select throws_ok(
  $$insert into public.categories (name) values ('Unauthorised category')$$,
  '42501', null, 'anonymous users cannot write category configuration'
);
reset role;

select set_config('request.jwt.claim.sub', (select customer_id::text from phase2_auth_fixture), true);
set local role authenticated;
select is((select count(*)::integer from public.profiles where id = (select customer_id from phase2_auth_fixture)), 1, 'customers can read their own profile');
select is((select count(*)::integer from public.profiles where id = (select provider_id from phase2_auth_fixture)), 0, 'customers cannot read another account profile');
select lives_ok(
  format('update public.profiles set full_name = %L where id = %L::uuid', 'Updated Customer', (select customer_id from phase2_auth_fixture)),
  'customers can update permitted fields on their own profile'
);
select is((select full_name from public.profiles where id = (select customer_id from phase2_auth_fixture)), 'Updated Customer', 'the own-profile update persisted');
select is((with changed as (update public.profiles set full_name = 'Not the owner' where id = (select provider_id from phase2_auth_fixture) returning id) select count(*)::integer from changed), 0, 'customers cannot update another account profile');
select throws_ok(
  format('update public.profiles set role = %L where id = %L::uuid', 'provider', (select customer_id from phase2_auth_fixture)),
  '42501', null, 'account role cannot be changed by the profile owner'
);
select throws_ok(
  format('insert into public.provider_profiles (profile_id, business_name) values (%L::uuid, %L)', (select customer_id from phase2_auth_fixture), 'Customer business'),
  '42501', null, 'customers cannot create provider profiles'
);
reset role;

select set_config('request.jwt.claim.sub', (select provider_id::text from phase2_auth_fixture), true);
set local role authenticated;
select is((select count(*)::integer from public.provider_profiles where profile_id = (select provider_id from phase2_auth_fixture)), 1, 'a provider can read its own provider profile');
select is((select count(*)::integer from public.provider_profiles where profile_id = (select second_provider_id from phase2_auth_fixture)), 0, 'a provider cannot read a different provider profile');
reset role;

select set_config('request.jwt.claim.sub', (select second_provider_id::text from phase2_auth_fixture), true);
set local role authenticated;
select lives_ok(
  format('insert into public.provider_profiles (profile_id, business_name, location) values (%L::uuid, %L, %L)', (select second_provider_id from phase2_auth_fixture), 'Created by provider', 'Nairobi'),
  'a provider can create its own provider profile'
);
select lives_ok(
  format('update public.provider_profiles set location = %L where profile_id = %L::uuid', 'Kiambu', (select second_provider_id from phase2_auth_fixture)),
  'a provider can update its own provider profile'
);
select is((with changed as (update public.provider_profiles set location = 'Cross-owner edit' where profile_id = (select provider_id from phase2_auth_fixture) returning profile_id) select count(*)::integer from changed), 0, 'a provider cannot update a different provider profile');
reset role;

select * from finish();
rollback;
