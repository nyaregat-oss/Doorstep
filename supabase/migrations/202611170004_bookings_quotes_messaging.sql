create type public.booking_request_kind as enum ('booking', 'quotation');
create type public.booking_state as enum ('pending', 'proposed', 'accepted', 'declined', 'in_progress', 'completed', 'cancelled');
create type public.quotation_state as enum ('quoted', 'accepted', 'declined');

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  provider_id uuid not null references public.provider_profiles(profile_id) on delete cascade,
  service_id uuid not null references public.services(id) on delete restrict,
  request_kind public.booking_request_kind not null default 'booking',
  customer_display_name text not null default 'Customer',
  description text not null check (char_length(description) between 10 and 4000),
  location text not null check (char_length(location) between 2 and 240),
  preferred_at timestamptz not null,
  customer_timezone text not null default 'Africa/Nairobi',
  proposed_at timestamptz,
  proposed_timezone text,
  status public.booking_state not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (status = 'proposed' and proposed_at is not null and proposed_timezone is not null)
    or (status <> 'proposed' and proposed_at is null and proposed_timezone is null)
  )
);

create index bookings_customer_created_idx on public.bookings (customer_id, created_at desc);
create index bookings_provider_status_created_idx on public.bookings (provider_id, status, created_at desc);
create index bookings_service_idx on public.bookings (service_id);
alter table public.bookings enable row level security;
grant select on public.bookings to authenticated;
grant insert (customer_id, provider_id, service_id, request_kind, description, location, preferred_at) on public.bookings to authenticated;

create policy "bookings_read_participants" on public.bookings
  for select to authenticated using (customer_id = (select auth.uid()) or provider_id = (select auth.uid()));
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
    )
  );

create function public.set_booking_customer_display_name()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  select coalesce(nullif(p.full_name, ''), 'Customer')
    into new.customer_display_name
    from public.profiles p
    where p.id = new.customer_id;
  return new;
end;
$$;
create trigger bookings_set_customer_display_name
  before insert on public.bookings
  for each row execute procedure public.set_booking_customer_display_name();

create table public.booking_events (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  from_status public.booking_state,
  to_status public.booking_state not null,
  created_at timestamptz not null default now()
);
create index booking_events_booking_created_idx on public.booking_events (booking_id, created_at);
alter table public.booking_events enable row level security;
grant select on public.booking_events to authenticated;
create policy "booking_events_read_participants" on public.booking_events
  for select to authenticated using (
    exists (
      select 1 from public.bookings b
      where b.id = booking_events.booking_id
        and (b.customer_id = (select auth.uid()) or b.provider_id = (select auth.uid()))
    )
  );

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete cascade,
  kind text not null check (char_length(kind) between 1 and 40),
  body text not null check (char_length(body) between 1 and 500),
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_unread_idx on public.notifications (user_id, read_at, created_at desc);
alter table public.notifications enable row level security;
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;
create policy "notifications_read_own" on public.notifications
  for select to authenticated using (user_id = (select auth.uid()));
create policy "notifications_update_own" on public.notifications
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  read_at timestamptz,
  created_at timestamptz not null default now(),
  check (sender_id <> recipient_id)
);
create index messages_booking_created_idx on public.messages (booking_id, created_at);
create index messages_recipient_unread_idx on public.messages (recipient_id, read_at, created_at desc);
alter table public.messages enable row level security;
grant select on public.messages to authenticated;
grant insert (booking_id, sender_id, recipient_id, body) on public.messages to authenticated;
grant update (read_at) on public.messages to authenticated;
create policy "messages_read_participants" on public.messages
  for select to authenticated using (sender_id = (select auth.uid()) or recipient_id = (select auth.uid()));
create policy "messages_insert_booking_participant" on public.messages
  for insert to authenticated with check (
    sender_id = (select auth.uid())
    and exists (
      select 1 from public.bookings b
      where b.id = public.messages.booking_id
        and ((b.customer_id = public.messages.sender_id and b.provider_id = public.messages.recipient_id)
          or (b.provider_id = public.messages.sender_id and b.customer_id = public.messages.recipient_id))
    )
  );
create policy "messages_mark_received_read" on public.messages
  for update to authenticated using (recipient_id = (select auth.uid()))
  with check (recipient_id = (select auth.uid()));

create table public.quotations (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  provider_id uuid not null references public.provider_profiles(profile_id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  message text not null check (char_length(message) between 5 and 2000),
  status public.quotation_state not null default 'quoted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index quotations_customer_created_idx on public.quotations (customer_id, created_at desc);
create index quotations_provider_created_idx on public.quotations (provider_id, created_at desc);
alter table public.quotations enable row level security;
grant select on public.quotations to authenticated;
grant insert (booking_id, provider_id, customer_id, amount, currency, message) on public.quotations to authenticated;
grant update (amount, currency, message) on public.quotations to authenticated;
create policy "quotations_read_participants" on public.quotations
  for select to authenticated using (customer_id = (select auth.uid()) or provider_id = (select auth.uid()));
create policy "quotations_insert_provider" on public.quotations
  for insert to authenticated with check (
    provider_id = (select auth.uid())
    and status = 'quoted'
    and exists (
      select 1 from public.profiles where id = (select auth.uid()) and role = 'provider'
    )
    and exists (
      select 1 from public.bookings b
      where b.id = public.quotations.booking_id
        and b.provider_id = public.quotations.provider_id
        and b.customer_id = public.quotations.customer_id
        and b.request_kind = 'quotation' and b.status = 'pending'
    )
  );
create policy "quotations_update_provider_offer" on public.quotations
  for update to authenticated using (
    provider_id = (select auth.uid()) and status = 'quoted'
    and exists (select 1 from public.bookings b where b.id = public.quotations.booking_id and b.status = 'pending')
  ) with check (
    provider_id = (select auth.uid()) and status = 'quoted'
    and exists (select 1 from public.bookings b where b.id = public.quotations.booking_id and b.status = 'pending')
  );

create function public.set_booking_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger bookings_set_updated_at before update on public.bookings
  for each row execute procedure public.set_booking_updated_at();
create trigger quotations_set_updated_at before update on public.quotations
  for each row execute procedure public.set_booking_updated_at();

create function public.notify_booking_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.booking_events (booking_id, actor_id, from_status, to_status)
  values (new.id, auth.uid(), null, new.status);
  insert into public.notifications (user_id, booking_id, kind, body)
  values (new.provider_id, new.id, 'booking_request', 'A new service request needs your response.');
  return new;
end;
$$;
create trigger bookings_notify_created after insert on public.bookings
  for each row execute procedure public.notify_booking_created();

create function public.record_booking_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  recipient uuid;
begin
  if new.status is distinct from old.status then
    insert into public.booking_events (booking_id, actor_id, from_status, to_status)
    values (new.id, auth.uid(), old.status, new.status);
    recipient := case when auth.uid() = new.customer_id then new.provider_id else new.customer_id end;
    insert into public.notifications (user_id, booking_id, kind, body)
    values (recipient, new.id, 'booking_status', 'A service request status changed to ' || replace(new.status::text, '_', ' ') || '.');
  end if;
  return new;
end;
$$;
create trigger bookings_record_status after update on public.bookings
  for each row execute procedure public.record_booking_status_change();

create function public.notify_new_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notifications (user_id, booking_id, kind, body)
  values (new.recipient_id, new.booking_id, 'message', 'You received a new message about a service request.');
  return new;
end;
$$;
create trigger messages_notify_recipient after insert on public.messages
  for each row execute procedure public.notify_new_message();

create function public.notify_new_quotation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notifications (user_id, booking_id, kind, body)
  values (new.customer_id, new.booking_id, 'quotation', 'A provider sent you a quotation.');
  return new;
end;
$$;
create trigger quotations_notify_customer after insert on public.quotations
  for each row execute procedure public.notify_new_quotation();

create function public.respond_to_booking(
  p_booking_id uuid,
  p_next public.booking_state,
  p_proposed_at timestamptz default null,
  p_proposed_timezone text default 'Africa/Nairobi'
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  booking public.bookings%rowtype;
  actor uuid := auth.uid();
begin
  if actor is null then raise exception 'Authentication required'; end if;
  select * into booking from public.bookings where id = p_booking_id for update;
  if not found then raise exception 'Service request not found'; end if;

  if actor = booking.provider_id then
    if booking.status = 'pending' and p_next in ('accepted', 'declined') then
      if p_proposed_at is not null then raise exception 'A proposed date is not allowed for this action'; end if;
    elsif booking.status = 'pending' and p_next = 'proposed' then
      if p_proposed_at is null or p_proposed_at <= now() then raise exception 'Choose a future alternative date'; end if;
      if not exists (select 1 from pg_catalog.pg_timezone_names where name = p_proposed_timezone) then raise exception 'Choose a valid timezone'; end if;
    elsif booking.status = 'accepted' and p_next = 'in_progress' then
      if p_proposed_at is not null then raise exception 'A proposed date is not allowed for this action'; end if;
    elsif booking.status = 'in_progress' and p_next = 'completed' then
      if p_proposed_at is not null then raise exception 'A proposed date is not allowed for this action'; end if;
    else
      raise exception 'This status change is not allowed for the provider';
    end if;
  elsif actor = booking.customer_id then
    if booking.status = 'pending' and p_next = 'cancelled' and booking.preferred_at > now() then
      if p_proposed_at is not null then raise exception 'A proposed date is not allowed for this action'; end if;
    elsif booking.status = 'accepted' and p_next = 'cancelled' and booking.preferred_at > now() then
      if p_proposed_at is not null then raise exception 'A proposed date is not allowed for this action'; end if;
    elsif booking.status = 'proposed' and p_next in ('accepted', 'declined') then
      if p_proposed_at is not null then raise exception 'A proposed date is not allowed for this action'; end if;
      if p_next = 'accepted' and booking.proposed_at <= now() then raise exception 'The proposed date has already passed'; end if;
    else
      raise exception 'This status change is not allowed for the customer';
    end if;
  else
    raise exception 'Only a booking participant can change this request';
  end if;

  if booking.status = 'proposed' and p_next = 'accepted' then
    update public.bookings set status = p_next, preferred_at = booking.proposed_at, customer_timezone = booking.proposed_timezone, proposed_at = null, proposed_timezone = null where id = booking.id;
  else
    update public.bookings set status = p_next,
      proposed_at = case when p_next = 'proposed' then p_proposed_at else null end,
      proposed_timezone = case when p_next = 'proposed' then p_proposed_timezone else null end
      where id = booking.id;
  end if;
end;
$$;
revoke all on function public.respond_to_booking(uuid, public.booking_state, timestamptz, text) from public;
grant execute on function public.respond_to_booking(uuid, public.booking_state, timestamptz, text) to authenticated;

create function public.respond_to_quotation(p_quotation_id uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  quotation public.quotations%rowtype;
  booking public.bookings%rowtype;
  actor uuid := auth.uid();
begin
  if actor is null then raise exception 'Authentication required'; end if;
  select * into quotation from public.quotations where id = p_quotation_id for update;
  if not found or quotation.customer_id <> actor or quotation.status <> 'quoted' then raise exception 'Quotation not found or unavailable'; end if;
  select * into booking from public.bookings where id = quotation.booking_id for update;
  if booking.status <> 'pending' then raise exception 'This request is no longer open'; end if;
  if p_accept and booking.preferred_at <= now() then raise exception 'The requested date has already passed'; end if;

  update public.quotations set status = case when p_accept then 'accepted'::public.quotation_state else 'declined'::public.quotation_state end where id = quotation.id;
  update public.bookings set status = case when p_accept then 'accepted'::public.booking_state else 'declined'::public.booking_state end where id = booking.id;
end;
$$;
revoke all on function public.respond_to_quotation(uuid, boolean) from public;
grant execute on function public.respond_to_quotation(uuid, boolean) to authenticated;
