-- ForFuture: in-app notification triggers (run after onboarding_and_notifications.sql)
-- Safe to re-run (idempotent). Creates notifications when users sign, support, or follow.

-- =============================================================================
-- Helper: insert notification (security definer — bypasses missing client INSERT policy)
-- =============================================================================

create or replace function public.create_app_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_entity_type text,
  p_entity_id uuid
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if p_user_id is null then
    return;
  end if;

  insert into public.notifications (
    user_id,
    type,
    title,
    message,
    entity_type,
    entity_id,
    is_read
  ) values (
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_entity_type,
    p_entity_id,
    false
  );
end;
$$;

revoke all on function public.create_app_notification(uuid, text, text, text, text, uuid) from public;

-- =============================================================================
-- Petition signed → notify petition creator
-- =============================================================================

create or replace function public.notify_on_petition_signature()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, private, public
as $$
declare
  v_owner_id uuid;
  v_title text;
  v_signer_name text;
begin
  select p.user_id, left(p.title, 120)
  into v_owner_id, v_title
  from private.posts p
  where p.id = new.petition_id
    and p.movement_type = 'youth_petition';

  if v_owner_id is null or v_owner_id = new.supporter_user_id then
    return new;
  end if;

  select coalesce(nullif(trim(pr.display_name), ''), 'A youth voice')
  into v_signer_name
  from public.profiles pr
  where pr.id = new.supporter_user_id;

  perform public.create_app_notification(
    v_owner_id,
    'petition_milestone',
    'New petition signature',
    v_signer_name || ' signed your petition: ' || coalesce(v_title, 'Untitled'),
    'petition',
    new.petition_id
  );

  return new;
end;
$$;

drop trigger if exists petition_signature_notify on public.petition_signatures;
create trigger petition_signature_notify
  after insert on public.petition_signatures
  for each row
  execute function public.notify_on_petition_signature();

-- =============================================================================
-- Movement support → notify movement creator
-- =============================================================================

create or replace function public.notify_on_post_action()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, private, public
as $$
declare
  v_owner_id uuid;
  v_title text;
  v_supporter_name text;
  v_entity_type text;
begin
  select p.user_id, left(p.title, 120),
    case
      when p.movement_type = 'youth_petition' then 'petition'
      when p.movement_type = 'quick_youth_poll' then 'poll'
      else 'movement'
    end
  into v_owner_id, v_title, v_entity_type
  from private.posts p
  where p.id = new.post_id;

  if v_owner_id is null or v_owner_id = new.user_id then
    return new;
  end if;

  select coalesce(nullif(trim(pr.display_name), ''), 'A youth voice')
  into v_supporter_name
  from public.profiles pr
  where pr.id = new.user_id;

  perform public.create_app_notification(
    v_owner_id,
    'movement_new_supporter',
    'New supporter',
    v_supporter_name || ' joined your movement: ' || coalesce(v_title, 'Untitled'),
    v_entity_type,
    new.post_id
  );

  return new;
end;
$$;

drop trigger if exists post_action_notify on public.post_actions;
create trigger post_action_notify
  after insert on public.post_actions
  for each row
  execute function public.notify_on_post_action();

-- =============================================================================
-- Movement follow → notify movement creator
-- =============================================================================

create or replace function public.notify_on_movement_follow()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, private, public
as $$
declare
  v_owner_id uuid;
  v_title text;
  v_follower_name text;
begin
  select p.user_id, left(p.title, 120)
  into v_owner_id, v_title
  from private.posts p
  where p.id = new.movement_id;

  if v_owner_id is null or v_owner_id = new.user_id then
    return new;
  end if;

  select coalesce(nullif(trim(pr.display_name), ''), 'A youth voice')
  into v_follower_name
  from public.profiles pr
  where pr.id = new.user_id;

  perform public.create_app_notification(
    v_owner_id,
    'movement_update',
    'New follower',
    v_follower_name || ' is now following: ' || coalesce(v_title, 'Untitled'),
    'movement',
    new.movement_id
  );

  return new;
end;
$$;

drop trigger if exists movement_follow_notify on public.movement_follows;
create trigger movement_follow_notify
  after insert on public.movement_follows
  for each row
  execute function public.notify_on_movement_follow();

notify pgrst, 'reload schema';
