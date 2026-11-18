-- Optional, approximate service-area centers for distance-ranked discovery.
-- Customer coordinates are query parameters only and are never written here.

create table public.provider_service_centers (
  provider_id uuid primary key references public.provider_profiles(profile_id) on delete cascade,
  latitude double precision not null check (
    latitude between -90 and 90
    and latitude = round(latitude::numeric, 2)::double precision
  ),
  longitude double precision not null check (
    longitude between -180 and 180
    and longitude = round(longitude::numeric, 2)::double precision
  ),
  updated_at timestamptz not null default now()
);
alter table public.provider_service_centers enable row level security;
revoke all on public.provider_service_centers from anon, authenticated;
grant select, insert, update, delete on public.provider_service_centers to authenticated;
create policy "provider_service_centers_read_owner_admin" on public.provider_service_centers
  for select to authenticated using (
    provider_id = (select auth.uid()) or public.is_compliance_admin()
  );
create policy "provider_service_centers_insert_owner" on public.provider_service_centers
  for insert to authenticated with check (
    provider_id = (select auth.uid())
    and exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'provider')
  );
create policy "provider_service_centers_update_owner" on public.provider_service_centers
  for update to authenticated using (
    provider_id = (select auth.uid())
    and exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'provider')
  ) with check (
    provider_id = (select auth.uid())
    and exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'provider')
  );
create policy "provider_service_centers_delete_owner" on public.provider_service_centers
  for delete to authenticated using (
    provider_id = (select auth.uid())
    and exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'provider')
  );

create or replace function public.nearby_provider_services(
  p_latitude double precision,
  p_longitude double precision,
  p_radius_km integer,
  p_query text default null,
  p_location text default null,
  p_category text default null,
  p_max_price numeric default null,
  p_availability text default null,
  p_limit integer default 50
)
returns table (
  service_id uuid,
  provider_id uuid,
  business_name text,
  service_name text,
  description text,
  location text,
  category text,
  starting_price numeric,
  currency text,
  distance_km numeric,
  created_at timestamptz
)
language plpgsql stable security definer set search_path = ''
as $$
declare
  search_latitude double precision;
  search_longitude double precision;
begin
  if p_latitude is null or p_latitude not between -90 and 90
    or p_longitude is null or p_longitude not between -180 and 180 then
    raise exception 'invalid search location';
  end if;
  if p_radius_km is null or p_radius_km not between 1 and 50 then
    raise exception 'radius must be between 1 and 50 km';
  end if;
  if p_max_price is not null and p_max_price < 0 then
    raise exception 'maximum price cannot be negative';
  end if;
  if p_availability is not null and p_availability not in ('today', 'tomorrow', 'this-week', 'weekends') then
    raise exception 'invalid availability filter';
  end if;

  -- Enforce coarse coordinates in the database too, even for direct RPC callers.
  search_latitude := round(p_latitude::numeric, 2)::double precision;
  search_longitude := round(p_longitude::numeric, 2)::double precision;

  return query
  with candidates as (
    select
      s.id as service_id,
      p.profile_id as provider_id,
      p.business_name,
      s.name as service_name,
      s.description,
      p.location,
      c.name as category,
      s.starting_price,
      s.currency,
      round((6371.0 * 2 * pg_catalog.asin(pg_catalog.sqrt(least(1.0::double precision,
        greatest(0.0::double precision,
          pg_catalog.sin(pg_catalog.radians((search_latitude - center.latitude) / 2)) ^ 2
          + pg_catalog.cos(pg_catalog.radians(search_latitude))
            * pg_catalog.cos(pg_catalog.radians(center.latitude))
            * pg_catalog.sin(pg_catalog.radians((search_longitude - center.longitude) / 2)) ^ 2
        )
      ))))::numeric, 1) as distance_km,
      s.created_at
    from public.services s
    join public.provider_profiles p on p.profile_id = s.provider_id
    join public.categories c on c.id = p.category_id and c.active
    join public.provider_service_centers center on center.provider_id = p.profile_id
    where s.active and not p.paused
      and public.category_is_launch_approved(p.category_id, p.profile_id)
      and (p_query is null or pg_catalog.strpos(pg_catalog.lower(
        pg_catalog.concat_ws(' ', s.name, s.description, p.business_name, c.name)
      ), pg_catalog.lower(pg_catalog.left(p_query, 80))) > 0)
      and (p_location is null or pg_catalog.strpos(pg_catalog.lower(p.location), pg_catalog.lower(pg_catalog.left(p_location, 80))) > 0)
      and (p_category is null or c.name = p_category)
      and (p_max_price is null or s.starting_price <= p_max_price)
      and (
        p_availability is null
        or (p_availability = 'today' and exists (
          select 1 from public.availability a where a.provider_id = p.profile_id and a.is_open
            and a.weekday = extract(dow from pg_catalog.timezone('Africa/Nairobi', now()))::integer
        ))
        or (p_availability = 'tomorrow' and exists (
          select 1 from public.availability a where a.provider_id = p.profile_id and a.is_open
            and a.weekday = ((extract(dow from pg_catalog.timezone('Africa/Nairobi', now()))::integer + 1) % 7)
        ))
        or (p_availability = 'weekends' and exists (
          select 1 from public.availability a where a.provider_id = p.profile_id and a.is_open and a.weekday in (0, 6)
        ))
        or (p_availability = 'this-week' and exists (
          select 1 from public.availability a where a.provider_id = p.profile_id and a.is_open
            and a.weekday >= extract(dow from pg_catalog.timezone('Africa/Nairobi', now()))::integer
        ))
      )
  )
  select candidates.service_id, candidates.provider_id, candidates.business_name,
    candidates.service_name, candidates.description, candidates.location,
    candidates.category, candidates.starting_price, candidates.currency,
    candidates.distance_km, candidates.created_at
  from candidates
  where candidates.distance_km <= p_radius_km
  order by candidates.distance_km asc, candidates.created_at desc
  limit least(greatest(coalesce(p_limit, 50), 1), 50);
end;
$$;
revoke all on function public.nearby_provider_services(double precision, double precision, integer, text, text, text, numeric, text, integer) from public;
grant execute on function public.nearby_provider_services(double precision, double precision, integer, text, text, text, numeric, text, integer) to anon, authenticated;
