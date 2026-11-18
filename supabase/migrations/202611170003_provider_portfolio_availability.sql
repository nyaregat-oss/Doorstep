create table public.availability (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.provider_profiles(profile_id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  is_open boolean not null default false,
  start_time time,
  end_time time,
  timezone text not null default 'Africa/Nairobi',
  updated_at timestamptz not null default now(),
  unique (provider_id, weekday),
  check (
    (is_open and start_time is not null and end_time is not null and start_time < end_time)
    or (not is_open and start_time is null and end_time is null)
  )
);

create index availability_provider_weekday_idx on public.availability (provider_id, weekday);

create function public.set_availability_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger availability_set_updated_at
  before update on public.availability
  for each row execute procedure public.set_availability_updated_at();

alter table public.availability enable row level security;
grant select on public.availability to anon, authenticated;
grant insert (provider_id, weekday, is_open, start_time, end_time, timezone) on public.availability to authenticated;
grant update (provider_id, weekday, is_open, start_time, end_time, timezone) on public.availability to authenticated;
grant delete on public.availability to authenticated;

create policy "availability_read_open" on public.availability
  for select to anon, authenticated using (
    is_open and exists (
      select 1 from public.provider_profiles
      where profile_id = provider_id and not paused
    )
  );
create policy "availability_read_own" on public.availability
  for select to authenticated using (provider_id = (select auth.uid()));
create policy "availability_insert_own" on public.availability
  for insert to authenticated with check (
    provider_id = (select auth.uid())
    and exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'provider')
  );
create policy "availability_update_own" on public.availability
  for update to authenticated using (
    provider_id = (select auth.uid())
    and exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'provider')
  ) with check (
    provider_id = (select auth.uid())
    and exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'provider')
  );
create policy "availability_delete_own" on public.availability
  for delete to authenticated using (provider_id = (select auth.uid()));

create table public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.provider_profiles(profile_id) on delete cascade,
  storage_path text not null unique,
  caption text not null default '' check (char_length(caption) <= 240),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index portfolio_items_provider_sort_idx on public.portfolio_items (provider_id, sort_order, created_at);
alter table public.portfolio_items enable row level security;
grant select on public.portfolio_items to anon, authenticated;
grant insert (provider_id, storage_path, caption, sort_order) on public.portfolio_items to authenticated;
grant update (caption, sort_order) on public.portfolio_items to authenticated;
grant delete on public.portfolio_items to authenticated;

create policy "portfolio_read_published" on public.portfolio_items
  for select to anon, authenticated using (
    exists (
      select 1 from public.provider_profiles
      where profile_id = provider_id and not paused
    )
  );
create policy "portfolio_read_own" on public.portfolio_items
  for select to authenticated using (provider_id = (select auth.uid()));
create policy "portfolio_insert_own" on public.portfolio_items
  for insert to authenticated with check (
    provider_id = (select auth.uid())
    and storage_path like (select auth.uid()::text) || '/%'
    and exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'provider')
  );
create policy "portfolio_update_own" on public.portfolio_items
  for update to authenticated using (
    provider_id = (select auth.uid())
    and exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'provider')
  ) with check (
    provider_id = (select auth.uid())
    and exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'provider')
  );
create policy "portfolio_delete_own" on public.portfolio_items
  for delete to authenticated using (
    provider_id = (select auth.uid())
    and exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'provider')
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'doorstep-provider-portfolio',
  'doorstep-provider-portfolio',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do nothing;

create policy "portfolio_storage_read_published" on storage.objects
  for select to anon, authenticated using (
    bucket_id = 'doorstep-provider-portfolio'
    and exists (
      select 1 from public.provider_profiles
      where profile_id::text = (storage.foldername(name))[1] and not paused
    )
  );
create policy "portfolio_storage_read_own" on storage.objects
  for select to authenticated using (
    bucket_id = 'doorstep-provider-portfolio'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
create policy "portfolio_storage_insert_own" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'doorstep-provider-portfolio'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'provider')
  );
create policy "portfolio_storage_delete_own" on storage.objects
  for delete to authenticated using (
    bucket_id = 'doorstep-provider-portfolio'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'provider')
  );
