-- May's schedule. Run once in the Supabase SQL editor; setup steps are in the README.
-- Call length (10), buffer (5) and lead time (3h) mirror BOOKING in src/config.ts.

-- Who may manage the schedule. Being signed in is not enough: the role comes from this table.
create table public.admins (
  user_id uuid primary key references auth.users on delete cascade
);

create function public.is_admin() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.admins where user_id = auth.uid()) $$;

alter table public.admins enable row level security;
create policy "admins read own row" on public.admins for select using (user_id = auth.uid());

-- The regular week. Dates in Israel time; 0 = Sunday … 6 = Saturday.
create table public.schedule_settings (
  id int primary key default 1 check (id = 1),
  work_days int[] not null,
  windows jsonb not null
);

insert into public.schedule_settings (work_days, windows) values (
  '{0,1,2,3,4}',
  '[{"start": "09:00", "end": "12:00"}, {"start": "17:00", "end": "20:00"}]'
);

alter table public.schedule_settings enable row level security;
create policy "anyone reads settings" on public.schedule_settings for select using (true);
create policy "admins update settings" on public.schedule_settings for update using (public.is_admin()) with check (public.is_admin());

-- Exceptions to the regular week. An empty time means the whole day.
create table public.schedule_overrides (
  date date not null,
  time text not null default '' check (time = '' or time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  is_open boolean not null,
  primary key (date, time)
);

alter table public.schedule_overrides enable row level security;
create policy "anyone reads overrides" on public.schedule_overrides for select using (true);
create policy "admins manage overrides" on public.schedule_overrides for all using (public.is_admin()) with check (public.is_admin());

-- Clients' details: readable by admins only. Visitors go through the two functions below.
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  start_at timestamptz not null,
  -- End of the call plus the buffer, so the database itself keeps the gap.
  blocked_until timestamptz not null,
  name text not null check (char_length(name) between 1 and 100),
  phone text not null check (char_length(phone) between 1 and 30),
  email text not null check (char_length(email) between 3 and 200),
  status text not null default 'held' check (status in ('held', 'released')),
  created_at timestamptz not null default now(),
  constraint bookings_no_overlap exclude using gist (tstzrange(start_at, blocked_until) with &&) where (status = 'held')
);

alter table public.bookings enable row level security;
create policy "admins read bookings" on public.bookings for select using (public.is_admin());
create policy "admins update bookings" on public.bookings for update using (public.is_admin()) with check (public.is_admin());

-- Taken times without any client details.
create function public.busy_times()
returns table (start_at timestamptz, blocked_until timestamptz)
language sql stable security definer set search_path = ''
as $$
  select start_at, blocked_until from public.bookings
  where status = 'held' and blocked_until > now()
$$;

-- Holds a slot. Returns false if it is closed, too soon, or taken; the exclusion constraint settles races.
create function public.book_slot(p_date date, p_time text, p_name text, p_phone text, p_email text)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  call_minutes constant int := 10;
  buffer_minutes constant int := 5;
  start_time time := p_time::time;
  starts timestamptz := (p_date + start_time) at time zone 'Asia/Jerusalem';
  settings public.schedule_settings;
  day_open boolean;
  slot_open boolean;
begin
  if starts < now() + interval '3 hours' or p_date > (now() at time zone 'Asia/Jerusalem')::date + 45 then
    return false;
  end if;

  select * into settings from public.schedule_settings;
  select is_open into day_open from public.schedule_overrides where date = p_date and time = '';
  select is_open into slot_open from public.schedule_overrides where date = p_date and time = p_time;

  if day_open is false or slot_open is false then
    return false;
  end if;

  if slot_open is null then
    if not coalesce(day_open, extract(dow from p_date)::int = any (settings.work_days)) then
      return false;
    end if;
    if not exists (
      select 1 from jsonb_to_recordset(settings.windows) as w(start time, "end" time)
      where start_time >= w.start
        and start_time + make_interval(mins => call_minutes) <= w."end"
        and (extract(epoch from start_time - w.start)::int / 60) % (call_minutes + buffer_minutes) = 0
    ) then
      return false;
    end if;
  end if;

  insert into public.bookings (start_at, blocked_until, name, phone, email)
  values (starts, starts + make_interval(mins => call_minutes + buffer_minutes), p_name, p_phone, p_email);
  return true;
exception
  when exclusion_violation then
    return false;
end;
$$;
