-- Run with `supabase test db` after applying all migrations.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(4);

select has_table('public', 'provider_service_centers', 'approximate service centers table exists');
select ok(not has_table_privilege('anon', 'public.provider_service_centers', 'select'), 'anonymous users cannot read service center coordinates');
select ok(has_function_privilege('anon', 'public.nearby_provider_services(double precision,double precision,integer,text,text,text,numeric,text,integer)', 'execute'), 'anonymous users can call nearby search');
select ok(
  position('search_latitude := round' in pg_get_functiondef('public.nearby_provider_services(double precision,double precision,integer,text,text,text,numeric,text,integer)'::regprocedure)) > 0
  and position('search_longitude := round' in pg_get_functiondef('public.nearby_provider_services(double precision,double precision,integer,text,text,text,numeric,text,integer)'::regprocedure)) > 0,
  'database rounds customer coordinates before distance calculation'
);

select * from finish();
rollback;
