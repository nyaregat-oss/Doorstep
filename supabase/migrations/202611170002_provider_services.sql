create table public.services (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.provider_profiles(profile_id) on delete cascade,
  name text not null check (char_length(name) between 3 and 100),
  description text not null default '' check (char_length(description) <= 2000),
  starting_price numeric(12, 2) not null check (starting_price >= 0),
  currency text not null default 'KES' check (currency ~ '^[A-Z]{3}$'),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index services_active_provider_idx on public.services (provider_id, active);
create index services_active_price_idx on public.services (active, starting_price);

create function public.set_service_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger services_set_updated_at
  before update on public.services
  for each row execute procedure public.set_service_updated_at();

create policy "provider_profiles_read_own" on public.provider_profiles
  for select to authenticated using (profile_id = (select auth.uid()));

alter table public.services enable row level security;

grant select on public.services to anon, authenticated;
grant insert (provider_id, name, description, starting_price, currency, active) on public.services to authenticated;
grant update (name, description, starting_price, currency, active) on public.services to authenticated;
grant delete on public.services to authenticated;

create policy "services_read_active" on public.services
  for select to anon, authenticated using (
    active and exists (
      select 1 from public.provider_profiles
      where profile_id = provider_id and not paused
    )
  );

create policy "services_read_own" on public.services
  for select to authenticated using (
    provider_id = (select auth.uid())
    and exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'provider')
  );

create policy "services_insert_own" on public.services
  for insert to authenticated with check (
    provider_id = (select auth.uid())
    and exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'provider')
  );

create policy "services_update_own" on public.services
  for update to authenticated using (
    provider_id = (select auth.uid())
    and exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'provider')
  ) with check (
    provider_id = (select auth.uid())
    and exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'provider')
  );

create policy "services_delete_own" on public.services
  for delete to authenticated using (
    provider_id = (select auth.uid())
    and exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'provider')
  );
