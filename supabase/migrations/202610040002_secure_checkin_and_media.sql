insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'announcement-media',
  'announcement-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Public can read announcement media"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'announcement-media');

create policy "Active staff upload announcement media"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'announcement-media' and public.current_staff_role() is not null);

create policy "Active staff update announcement media"
  on storage.objects for update to authenticated
  using (bucket_id = 'announcement-media' and public.current_staff_role() is not null)
  with check (bucket_id = 'announcement-media' and public.current_staff_role() is not null);

create policy "Admins delete announcement media"
  on storage.objects for delete to authenticated
  using (bucket_id = 'announcement-media' and public.current_staff_role() = 'ADMIN');

create table public.regular_gathering_slots (
  slot_id text primary key,
  event_type text not null check (event_type in ('Prayer Meeting', 'Worship Service', 'Thanksgiving')),
  event_name text not null,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  day_name text not null,
  is_active boolean not null default true
);

insert into public.regular_gathering_slots (slot_id, event_type, event_name, day_of_week, start_time, day_name)
values
  ('PM-WED-0330', 'Prayer Meeting', 'Congregational Prayer Meeting', 3, '03:30', 'Wed'),
  ('PM-WED-0700', 'Prayer Meeting', 'Congregational Prayer Meeting', 3, '07:00', 'Wed'),
  ('PM-WED-1730', 'Prayer Meeting', 'Congregational Prayer Meeting', 3, '17:30', 'Wed'),
  ('PM-THU-0700', 'Prayer Meeting', 'Congregational Prayer Meeting', 4, '07:00', 'Thurs'),
  ('PM-THU-1900', 'Prayer Meeting', 'Congregational Prayer Meeting', 4, '19:00', 'Thurs'),
  ('WS-SAT-0330', 'Worship Service', 'Worship Service', 6, '03:30', 'Sat'),
  ('WS-SAT-0700', 'Worship Service', 'Worship Service', 6, '07:00', 'Sat'),
  ('WS-SAT-1130', 'Worship Service', 'Worship Service', 6, '11:30', 'Sat'),
  ('WS-SUN-1200', 'Worship Service', 'Worship Service', 0, '12:00', 'Sun'),
  ('TG-SAT-1600', 'Thanksgiving', 'Weekly Thanksgiving to God', 6, '16:00', 'Sat'),
  ('TG-SUN-0500', 'Thanksgiving', 'Weekly Thanksgiving to God', 0, '05:00', 'Sun'),
  ('TG-MON-0830', 'Thanksgiving', 'Weekly Thanksgiving to God', 1, '08:30', 'Mon')
on conflict (slot_id) do update
set event_type = excluded.event_type,
    event_name = excluded.event_name,
    day_of_week = excluded.day_of_week,
    start_time = excluded.start_time,
    day_name = excluded.day_name,
    is_active = true;

alter table public.regular_gathering_slots enable row level security;
revoke all on public.regular_gathering_slots from public, anon, authenticated;

create table public.public_checkin_attempts (
  member_id text primary key,
  window_started_at timestamptz not null default now(),
  attempt_count integer not null default 0
);

alter table public.public_checkin_attempts enable row level security;
revoke all on public.public_checkin_attempts from public, anon, authenticated;

create or replace function public.public_member_check_in(
  p_member_id text,
  p_birthday date,
  p_slot_id text,
  p_event_date date
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_slot public.regular_gathering_slots%rowtype;
  v_member public.members%rowtype;
  v_existing_event public.attendance_events%rowtype;
  v_existing_schedule public.event_schedules%rowtype;
  v_event_id text;
  v_schedule_id text;
  v_event_name text;
  v_event_type text;
  v_start_time time;
  v_attendance_id text;
  v_inserted_attendance_id text;
  v_attempt_count integer;
  v_now_pht timestamp without time zone;
  v_event_start timestamp without time zone;
  v_attendance_total integer;
  v_attendance_present integer;
  v_last_attendance date;
  v_recent_absent integer := 0;
  v_inactive_threshold integer;
  v_at_risk_threshold integer;
  v_days_inactive_threshold integer;
  v_regular_threshold numeric;
  v_active_threshold numeric;
  v_excused_counts_as_missed boolean;
  v_days_since_attendance integer;
  v_activity_status text;
  v_activity_reason text;
  v_recent_row record;
  v_created_at timestamptz := now();
  v_schedule_label text;
  v_attendance_data jsonb;
  v_duplicate_data jsonb;
begin
  if p_member_id is null or length(trim(p_member_id)) < 3 or p_birthday is null or p_slot_id is null or p_event_date is null then
    return jsonb_build_object('success', false, 'message', 'Enter your Member ID and full birthday to continue.');
  end if;

  v_now_pht := timezone('Asia/Manila', now());
  if left(p_slot_id, 6) = 'EVENT:' then
    v_event_id := split_part(p_slot_id, ':', 2);
    v_schedule_id := split_part(p_slot_id, ':', 3);
    select * into v_existing_event
    from public.attendance_events
    where event_id = v_event_id and is_published = true
      and p_event_date between start_date and end_date;
    select * into v_existing_schedule
    from public.event_schedules
    where schedule_id = v_schedule_id and event_id = v_event_id
      and scheduled_date = p_event_date and status = 'Active';
    if v_existing_event.event_id is null or v_existing_schedule.schedule_id is null then
      return jsonb_build_object('success', false, 'message', 'This event schedule is unavailable for check-in.');
    end if;
    v_event_name := v_existing_event.event_name;
    v_event_type := v_existing_event.event_type;
    v_start_time := nullif(v_existing_schedule.data->>'startTime', '')::time;
    v_schedule_label := coalesce(v_existing_schedule.data->>'scheduleLabel', v_event_name);
    if v_start_time is null then
      return jsonb_build_object('success', false, 'message', 'This event schedule has no valid start time.');
    end if;
  else
    select * into v_slot
    from public.regular_gathering_slots
    where slot_id = upper(trim(p_slot_id)) and is_active = true;
    if not found then
      return jsonb_build_object('success', false, 'message', 'This gathering is unavailable for check-in.');
    end if;
    if extract(dow from p_event_date)::integer <> v_slot.day_of_week then
      return jsonb_build_object('success', false, 'message', 'This gathering is unavailable for the selected date.');
    end if;
    v_event_name := v_slot.event_name;
    v_event_type := v_slot.event_type;
    v_start_time := v_slot.start_time;
    v_event_id := 'REG-' || v_slot.slot_id || '-' || to_char(p_event_date, 'YYYYMMDD');
    v_schedule_id := 'SCH-' || v_slot.slot_id || '-' || to_char(p_event_date, 'YYYYMMDD');
    v_schedule_label := v_slot.day_name || ' ' || to_char(v_slot.start_time, 'FMHH12:MI AM');
  end if;

  v_event_start := p_event_date::timestamp + v_start_time;
  if p_event_date < v_now_pht::date
    or p_event_date > v_now_pht::date + 7
    or v_now_pht < v_event_start - interval '120 minutes'
    or v_now_pht > v_event_start + interval '180 minutes' then
    return jsonb_build_object('success', false, 'message', 'Check-in is not open for this gathering yet.');
  end if;

  select * into v_member
  from public.members
  where upper(member_id) = upper(trim(p_member_id))
    and membership_status in ('Active', 'On & Off');

  if not found then
    return jsonb_build_object('success', false, 'message', 'We could not verify those details. Check your Member ID and full birthday, or ask an officer for help.');
  end if;

  insert into public.public_checkin_attempts as attempts (member_id, window_started_at, attempt_count)
  values (v_member.member_id, now(), 1)
  on conflict (member_id) do update
  set window_started_at = case
        when attempts.window_started_at < now() - interval '15 minutes' then now()
        else attempts.window_started_at
      end,
      attempt_count = case
        when attempts.window_started_at < now() - interval '15 minutes' then 1
        else attempts.attempt_count + 1
      end
  returning attempt_count into v_attempt_count;

  if v_attempt_count > 5 then
    return jsonb_build_object('success', false, 'message', 'We could not verify those details. Check your Member ID and full birthday, or ask an officer for help.');
  end if;

  if v_member.data->>'birthday' is distinct from p_birthday::text then
    return jsonb_build_object('success', false, 'message', 'We could not verify those details. Check your Member ID and full birthday, or ask an officer for help.');
  end if;

  if left(p_slot_id, 6) <> 'EVENT:' then
  insert into public.attendance_events (
    event_id, event_name, event_type, start_date, end_date, is_published, data, created_at, updated_at
  ) values (
    v_event_id,
    v_event_name,
    v_event_type,
    p_event_date,
    p_event_date,
    true,
    jsonb_build_object(
      'eventId', v_event_id,
      'eventName', v_event_name,
      'eventType', v_event_type,
      'startDate', p_event_date::text,
      'endDate', p_event_date::text,
      'location', 'Local of Ascoville',
      'status', 'Ongoing',
      'isPublished', true,
      'createdBy', 'Public Self Check-in',
      'createdAt', v_created_at,
      'updatedAt', v_created_at
    ),
    v_created_at,
    v_created_at
  ) on conflict (event_id) do nothing;

  insert into public.event_schedules (
    schedule_id, event_id, scheduled_date, status, data, created_at, updated_at
  ) values (
    v_schedule_id,
    v_event_id,
    p_event_date,
    'Active',
    jsonb_build_object(
      'scheduleId', v_schedule_id,
      'eventId', v_event_id,
      'date', p_event_date::text,
      'startTime', to_char(v_start_time, 'FMHH12:MI AM'),
      'scheduleLabel', v_schedule_label,
      'location', 'Local of Ascoville',
      'status', 'Active',
      'createdAt', v_created_at,
      'updatedAt', v_created_at
    ),
    v_created_at,
    v_created_at
  ) on conflict (schedule_id) do nothing;
  end if;

  v_attendance_id := 'ATT-PUB-' || replace(gen_random_uuid()::text, '-', '');
  v_attendance_data := jsonb_build_object(
    'attendanceId', v_attendance_id,
    'eventId', v_event_id,
    'scheduleId', v_schedule_id,
    'memberId', v_member.member_id,
    'memberName', v_member.full_name,
    'eventName', v_event_name,
    'eventDate', p_event_date::text,
    'schedule', v_schedule_label,
    'attendanceStatus', 'Present',
    'recordedBy', 'Member Self Check-in',
    'recordedAt', v_created_at,
    'updatedAt', v_created_at,
    'notes', 'Recorded via secure public check-in'
  );

  insert into public.attendance_records (
    attendance_id, member_id, event_id, schedule_id, attendance_status,
    event_date, recorded_at, data, created_at, updated_at
  ) values (
    v_attendance_id,
    v_member.member_id,
    v_event_id,
    v_schedule_id,
    'Present',
    p_event_date,
    v_created_at,
    v_attendance_data,
    v_created_at,
    v_created_at
  ) on conflict (member_id, schedule_id) do nothing
  returning attendance_id into v_inserted_attendance_id;

  if v_inserted_attendance_id is null then
    select data into v_duplicate_data
    from public.attendance_records
    where member_id = v_member.member_id and schedule_id = v_schedule_id;
    return jsonb_build_object(
      'success', true,
      'duplicate', true,
      'memberName', v_member.full_name,
      'eventName', v_event_name,
      'eventDate', p_event_date::text,
      'scheduleLabel', v_schedule_label,
      'attendanceRecord', v_duplicate_data
    );
  end if;

  select count(*) filter (where attendance_status <> 'Excused' or coalesce((
           select (value #>> '{attendanceRules,excusedCountsAsMissed}')::boolean
           from public.app_settings where setting_key = 'system_settings'
         ), false))::integer,
         count(*) filter (where attendance_status in ('Present', 'Late'))::integer,
         max(event_date) filter (where attendance_status in ('Present', 'Late'))
  into v_attendance_total, v_attendance_present, v_last_attendance
  from public.attendance_records
  where member_id = v_member.member_id;

  select
    coalesce((select (value #>> '{attendanceRules,missedEventsBeforeInactive}')::integer from public.app_settings where setting_key = 'system_settings'), 5),
    coalesce((select (value #>> '{attendanceRules,missedEventsBeforeAtRisk}')::integer from public.app_settings where setting_key = 'system_settings'), 3),
    coalesce((select (value #>> '{attendanceRules,daysWithoutAttendanceBeforeInactive}')::integer from public.app_settings where setting_key = 'system_settings'), 30),
    coalesce((select (value #>> '{attendanceRules,regularThresholdPercent}')::numeric from public.app_settings where setting_key = 'system_settings'), 75),
    coalesce((select (value #>> '{attendanceRules,activeThresholdPercent}')::numeric from public.app_settings where setting_key = 'system_settings'), 50),
    coalesce((select (value #>> '{attendanceRules,excusedCountsAsMissed}')::boolean from public.app_settings where setting_key = 'system_settings'), false)
  into v_inactive_threshold, v_at_risk_threshold, v_days_inactive_threshold,
       v_regular_threshold, v_active_threshold, v_excused_counts_as_missed;

  for v_recent_row in
    select attendance_status
    from public.attendance_records
    where member_id = v_member.member_id
    order by event_date desc, recorded_at desc
    limit greatest(v_inactive_threshold, 5)
  loop
    if v_recent_row.attendance_status = 'Absent' then
      v_recent_absent := v_recent_absent + 1;
    end if;
  end loop;

  v_days_since_attendance := (v_now_pht::date - v_last_attendance);
  if v_days_since_attendance >= v_days_inactive_threshold then
    v_activity_status := 'Inactive';
    v_activity_reason := 'No attendance for ' || v_days_since_attendance || ' days.';
  elsif v_recent_absent >= v_inactive_threshold then
    v_activity_status := 'Inactive';
    v_activity_reason := 'Missed ' || v_recent_absent || ' recent qualifying events.';
  elsif v_recent_absent >= v_at_risk_threshold
    or (v_attendance_total > 0 and v_attendance_present * 100.0 / v_attendance_total < v_active_threshold) then
    v_activity_status := 'At Risk';
    v_activity_reason := 'Recent attendance is below the active threshold.';
  elsif v_attendance_total > 0 and v_attendance_present * 100.0 / v_attendance_total >= v_regular_threshold then
    v_activity_status := 'Regular';
    v_activity_reason := 'Attendance rate meets the regular threshold.';
  else
    v_activity_status := 'Active';
    v_activity_reason := 'Attendance rate is below the regular threshold.';
  end if;

  update public.members
  set updated_at = v_created_at,
      data = data || jsonb_build_object(
        'lastAttendanceDate', v_last_attendance::text,
        'attendanceCount', v_attendance_present,
        'attendancePercentage', case
          when v_attendance_total > 0 then round(v_attendance_present * 100.0 / v_attendance_total, 1)
          else 0
        end,
        'activityStatus', v_activity_status,
        'activityReason', v_activity_reason,
        'updatedAt', v_created_at
      )
  where member_id = v_member.member_id;

  return jsonb_build_object(
    'success', true,
    'duplicate', false,
    'memberName', v_member.full_name,
    'eventName', v_event_name,
    'eventDate', p_event_date::text,
    'scheduleLabel', v_schedule_label,
    'attendanceRecord', v_attendance_data
  );
end;
$$;

revoke all on function public.public_member_check_in(text, date, text, date) from public;
grant execute on function public.public_member_check_in(text, date, text, date) to anon, authenticated;