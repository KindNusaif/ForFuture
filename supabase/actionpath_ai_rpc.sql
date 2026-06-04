-- ActionPath AI — atomic rate-limit RPCs (single round-trip per check / record)
-- Run in Supabase SQL Editor after actionpath_ai_rate_limit.sql (and rate_limit_fix.sql if needed).

create or replace function public.actionpath_ai_check_rate_limit(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_row public.actionpath_ai_usage%rowtype;
  v_cooldown_sec constant int := 30;
  v_max_per_hour constant int := 15;
  v_window_start timestamptz;
  v_count int;
  v_retry_sec int;
  v_mins int;
begin
  select * into v_row
  from public.actionpath_ai_usage
  where user_id = p_user_id;

  if found and v_row.last_request_at is not null then
    v_retry_sec := ceil(
      extract(epoch from (v_row.last_request_at + make_interval(secs => v_cooldown_sec) - v_now))
    )::int;
    if v_retry_sec > 0 then
      return jsonb_build_object(
        'allowed', false,
        'retry_after_sec', v_retry_sec,
        'reason', 'cooldown',
        'message', format('Please wait %s seconds before generating again.', v_retry_sec)
      );
    end if;
  end if;

  v_window_start := coalesce(v_row.window_start, v_now);
  v_count := coalesce(v_row.request_count, 0);

  if v_now > v_window_start + interval '1 hour' then
    v_window_start := v_now;
    v_count := 0;
  end if;

  if v_count >= v_max_per_hour then
    v_retry_sec := greatest(
      60,
      ceil(extract(epoch from (v_window_start + interval '1 hour' - v_now)))::int
    );
    v_mins := greatest(1, ceil(v_retry_sec / 60.0)::int);
    return jsonb_build_object(
      'allowed', false,
      'retry_after_sec', v_retry_sec,
      'reason', 'hourly',
      'message', format(
        'You''ve used ActionPath AI many times this hour. Try again in about %s minutes.',
        v_mins
      )
    );
  end if;

  return jsonb_build_object('allowed', true);
end;
$$;

create or replace function public.actionpath_ai_record_success(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_row public.actionpath_ai_usage%rowtype;
  v_window_start timestamptz;
  v_count int;
begin
  select * into v_row
  from public.actionpath_ai_usage
  where user_id = p_user_id
  for update;

  if not found then
    insert into public.actionpath_ai_usage (user_id, window_start, request_count, last_request_at)
    values (p_user_id, v_now, 1, v_now);
    return;
  end if;

  v_window_start := coalesce(v_row.window_start, v_now);
  v_count := coalesce(v_row.request_count, 0);

  if v_now > v_window_start + interval '1 hour' then
    v_window_start := v_now;
    v_count := 0;
  end if;

  update public.actionpath_ai_usage
  set
    window_start = v_window_start,
    request_count = v_count + 1,
    last_request_at = v_now
  where user_id = p_user_id;
end;
$$;

revoke all on function public.actionpath_ai_check_rate_limit(uuid) from public;
revoke all on function public.actionpath_ai_record_success(uuid) from public;
grant execute on function public.actionpath_ai_check_rate_limit(uuid) to service_role;
grant execute on function public.actionpath_ai_record_success(uuid) to service_role;
