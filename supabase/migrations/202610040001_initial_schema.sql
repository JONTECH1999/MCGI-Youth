create table public.staff_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  full_name text not null,
  role text not null check (role in ('ADMIN', 'OFFICER')),
  title text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.current_staff_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.staff_profiles
  where user_id = auth.uid()
    and is_active = true
  limit 1;
$$;

revoke all on function public.current_staff_role() from public, anon;
grant execute on function public.current_staff_role() to authenticated;

create table public.members (
  member_id text primary key,
  full_name text not null,
  membership_status text not null,
  member_category text not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.attendance_events (
  event_id text primary key,
  event_name text not null,
  event_type text not null,
  start_date date not null,
  end_date date not null,
  is_published boolean not null default false,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create table public.event_schedules (
  schedule_id text primary key,
  event_id text not null references public.attendance_events (event_id) on delete cascade,
  scheduled_date date not null,
  status text not null check (status in ('Active', 'Cancelled')),
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.attendance_records (
  attendance_id text primary key,
  member_id text not null references public.members (member_id) on delete restrict,
  event_id text not null references public.attendance_events (event_id) on delete restrict,
  schedule_id text not null references public.event_schedules (schedule_id) on delete restrict,
  attendance_status text not null check (attendance_status in ('Present', 'Absent', 'Excused', 'Late')),
  event_date date not null,
  recorded_at timestamptz not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (member_id, schedule_id)
);

create table public.announcements (
  announcement_id text primary key,
  title text not null,
  status text not null check (status in ('Draft', 'Published', 'Archived')),
  publish_date date not null,
  event_date text,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.app_settings (
  setting_key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.member_status_history (
  history_id text primary key,
  member_id text not null references public.members (member_id) on delete cascade,
  changed_at timestamptz not null default now(),
  data jsonb not null
);

create table public.activity_logs (
  log_id text primary key,
  occurred_at timestamptz not null,
  data jsonb not null
);

create table public.report_snapshots (
  snapshot_id text primary key,
  created_at timestamptz not null,
  data jsonb not null
);

create index members_full_name_idx on public.members (full_name);
create index members_status_idx on public.members (membership_status);
create index event_schedules_event_date_idx on public.event_schedules (event_id, scheduled_date);
create index attendance_records_member_date_idx on public.attendance_records (member_id, event_date desc);
create index attendance_records_event_schedule_idx on public.attendance_records (event_id, schedule_id);
create index announcements_status_publish_date_idx on public.announcements (status, publish_date desc);
create index activity_logs_occurred_at_idx on public.activity_logs (occurred_at desc);

alter table public.staff_profiles enable row level security;
alter table public.members enable row level security;
alter table public.attendance_events enable row level security;
alter table public.event_schedules enable row level security;
alter table public.attendance_records enable row level security;
alter table public.announcements enable row level security;
alter table public.app_settings enable row level security;
alter table public.member_status_history enable row level security;
alter table public.activity_logs enable row level security;
alter table public.report_snapshots enable row level security;

create policy "Staff can read own profile"
  on public.staff_profiles for select to authenticated
  using (user_id = auth.uid() or public.current_staff_role() = 'ADMIN');

create policy "Admins manage staff profiles"
  on public.staff_profiles for all to authenticated
  using (public.current_staff_role() = 'ADMIN')
  with check (public.current_staff_role() = 'ADMIN');

create policy "Staff manage members"
  on public.members for all to authenticated
  using (public.current_staff_role() is not null)
  with check (public.current_staff_role() is not null);

create policy "Staff manage attendance events"
  on public.attendance_events for all to authenticated
  using (public.current_staff_role() is not null)
  with check (public.current_staff_role() is not null);

create policy "Staff manage event schedules"
  on public.event_schedules for all to authenticated
  using (public.current_staff_role() is not null)
  with check (public.current_staff_role() is not null);

create policy "Staff manage attendance records"
  on public.attendance_records for all to authenticated
  using (public.current_staff_role() is not null)
  with check (public.current_staff_role() is not null);

create policy "Staff manage announcements"
  on public.announcements for all to authenticated
  using (public.current_staff_role() is not null)
  with check (public.current_staff_role() is not null);

create policy "Public can read published announcements"
  on public.announcements for select to anon
  using (status = 'Published');

create policy "Staff manage app settings"
  on public.app_settings for all to authenticated
  using (public.current_staff_role() is not null)
  with check (public.current_staff_role() is not null);

create policy "Public can read landing page settings"
  on public.app_settings for select to anon
  using (setting_key = 'landing_page_config');

create policy "Staff manage member status history"
  on public.member_status_history for all to authenticated
  using (public.current_staff_role() is not null)
  with check (public.current_staff_role() is not null);

create policy "Staff manage activity logs"
  on public.activity_logs for all to authenticated
  using (public.current_staff_role() is not null)
  with check (public.current_staff_role() is not null);

create policy "Staff manage report snapshots"
  on public.report_snapshots for all to authenticated
  using (public.current_staff_role() is not null)
  with check (public.current_staff_role() is not null);

create policy "Public can read published events"
  on public.attendance_events for select to anon
  using (is_published = true);

create policy "Public can read active schedules for published events"
  on public.event_schedules for select to anon
  using (
    status = 'Active'
    and exists (
      select 1
      from public.attendance_events
      where attendance_events.event_id = event_schedules.event_id
        and attendance_events.is_published = true
    )
  );

grant select on public.announcements, public.attendance_events, public.event_schedules, public.app_settings to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;