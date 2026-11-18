create extension if not exists pgcrypto;

create type public.account_role as enum ('customer', 'provider');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.account_role not null default 'customer',
  full_name text not null default '',
  phone text,
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text not null default '',
  sort_order integer not null default 0,
  active boolean not null default true
);

create table public.provider_profiles (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  business_name text not null,
  category_id uuid references public.categories(id) on delete set null,
  location text not null default '',
  bio text not null default '',
  years_experience integer not null default 0 check (years_experience >= 0),
  verified boolean not null default false,
  paused boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.provider_profiles enable row level security;

grant select on public.profiles to authenticated;
grant update (full_name, phone) on public.profiles to authenticated;
grant select on public.categories to anon, authenticated;
grant select on public.provider_profiles to anon, authenticated;
grant insert (profile_id, business_name, category_id, location, bio, years_experience, paused) on public.provider_profiles to authenticated;
grant update (business_name, category_id, location, bio, years_experience, paused) on public.provider_profiles to authenticated;

create policy "profiles_read_own" on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "profiles_update_own" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "categories_read_active" on public.categories for select to anon, authenticated using (active);
create policy "provider_profiles_read_published" on public.provider_profiles for select to anon, authenticated using (not paused);
create policy "provider_profiles_insert_own" on public.provider_profiles for insert to authenticated with check (profile_id = (select auth.uid()) and exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'provider'));
create policy "provider_profiles_update_own" on public.provider_profiles for update to authenticated using (profile_id = (select auth.uid()) and exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'provider')) with check (profile_id = (select auth.uid()) and exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'provider'));

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  chosen_role public.account_role;
  chosen_category uuid;
begin
  chosen_role := case when new.raw_user_meta_data ->> 'role' = 'provider' then 'provider'::public.account_role else 'customer'::public.account_role end;
  insert into public.profiles (id, role, full_name, phone)
  values (new.id, chosen_role, coalesce(new.raw_user_meta_data ->> 'full_name', ''), nullif(new.raw_user_meta_data ->> 'phone', ''));

  if chosen_role = 'provider' then
    select id into chosen_category from public.categories where name = new.raw_user_meta_data ->> 'category' and active limit 1;
    insert into public.provider_profiles (profile_id, business_name, category_id, location)
    values (new.id, coalesce(nullif(new.raw_user_meta_data ->> 'business_name', ''), new.raw_user_meta_data ->> 'full_name', 'Provider'), chosen_category, coalesce(new.raw_user_meta_data ->> 'location', ''));
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

insert into public.categories (name, description, sort_order) values
  ('Plumbing', 'Leaks, drains, and installs', 1),
  ('Electrical', 'Wiring, lighting, and repairs', 2),
  ('Cleaning', 'Homes, offices, and deep cleans', 3),
  ('Home repairs', 'Fixes and maintenance', 4),
  ('Painting', 'Interior and exterior', 5),
  ('Carpentry', 'Furniture and fittings', 6),
  ('Beauty', 'Hair, makeup, and grooming', 7),
  ('Photography', 'Portraits, events, and products', 8),
  ('Event planning', 'Parties to weddings', 9),
  ('Moving', 'Moving and delivery', 10),
  ('Gardening', 'Lawns and landscaping', 11),
  ('Catering', 'Food for any occasion', 12),
  ('IT support', 'Computer and network help', 13),
  ('Web and design', 'Websites and graphics', 14),
  ('Tutoring', 'Lessons for all ages', 15),
  ('Automotive', 'Repairs and detailing', 16)
on conflict (name) do nothing;
