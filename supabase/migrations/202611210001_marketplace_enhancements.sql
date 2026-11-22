-- Additive marketplace enhancements: provider headline/skills, saved providers, and verified-booking customer reviews.
-- Existing functionality remains fully compatible if this migration is applied incrementally.

alter table public.provider_profiles
  add column if not exists headline text not null default '' check (char_length(headline) <= 140),
  add column if not exists skills text[] not null default '{}';

grant update (headline, skills) on public.provider_profiles to authenticated;

create table if not exists public.saved_providers (
  customer_id uuid not null references public.profiles(id) on delete cascade,
  provider_id uuid not null references public.provider_profiles(profile_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (customer_id, provider_id)
);

create index if not exists saved_providers_customer_created_idx
  on public.saved_providers (customer_id, created_at desc);

alter table public.saved_providers enable row level security;
revoke all on public.saved_providers from anon, authenticated;
grant select, insert, delete on public.saved_providers to authenticated;

create policy "saved_providers_read_own" on public.saved_providers
  for select to authenticated using (customer_id = (select auth.uid()));

create policy "saved_providers_insert_own" on public.saved_providers
  for insert to authenticated with check (
    customer_id = (select auth.uid())
    and exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'customer')
  );

create policy "saved_providers_delete_own" on public.saved_providers
  for delete to authenticated using (customer_id = (select auth.uid()));

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  provider_id uuid not null references public.provider_profiles(profile_id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text not null default '' check (char_length(comment) <= 1500),
  created_at timestamptz not null default now()
);

create index if not exists reviews_provider_created_idx
  on public.reviews (provider_id, created_at desc);

create index if not exists reviews_customer_created_idx
  on public.reviews (customer_id, created_at desc);

alter table public.reviews enable row level security;
revoke all on public.reviews from anon, authenticated;
grant select on public.reviews to anon, authenticated;
grant insert (booking_id, customer_id, provider_id, rating, comment) on public.reviews to authenticated;

create policy "reviews_read_published_or_participant" on public.reviews
  for select to anon, authenticated using (
    customer_id = (select auth.uid())
    or provider_id = (select auth.uid())
    or exists (
      select 1 from public.provider_profiles p
      where p.profile_id = reviews.provider_id
        and not p.paused
        and public.category_is_launch_approved(p.category_id, p.profile_id)
    )
  );

create policy "reviews_insert_completed_booking_customer" on public.reviews
  for insert to authenticated with check (
    customer_id = (select auth.uid())
    and exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'customer')
    and exists (
      select 1 from public.bookings b
      where b.id = reviews.booking_id
        and b.customer_id = (select auth.uid())
        and b.provider_id = reviews.provider_id
        and b.status = 'completed'
    )
  );
