-- Fix: Function Search Path Mutable (Supabase linter)
-- Locks search_path on custom functions so callers cannot hijack name resolution.
-- Safe to run multiple times.

create or replace function public.generate_youth_voice_id()
returns text
language plpgsql
set search_path = pg_catalog
as $$
declare
  chars text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  result text;
  i int;
begin
  result := 'YV-';
  for i in 1..5 loop
    result := result || substr(chars, 1 + floor(random() * length(chars))::int, 1);
  end loop;
  return result;
end;
$$;

create or replace function public.profiles_assign_youth_voice_id()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  candidate text;
  attempts int := 0;
begin
  if new.youth_voice_id is not null then
    return new;
  end if;
  loop
    candidate := public.generate_youth_voice_id();
    if not exists (
      select 1 from public.profiles where youth_voice_id = candidate
    ) then
      new.youth_voice_id := candidate;
      return new;
    end if;
    attempts := attempts + 1;
    if attempts > 20 then
      raise exception 'Could not generate unique youth_voice_id';
    end if;
  end loop;
end;
$$;

create or replace function public.posts_enforce_youth_voice_privacy()
returns trigger
language plpgsql
set search_path = pg_catalog, private, public
as $$
begin
  if new.posting_identity = 'youth_voice' then
    if new.youth_voice_id is null then
      raise exception 'youth_voice_id is required for youth_voice posts';
    end if;
    new.author_name := 'Youth Voice ' || new.youth_voice_id;
  end if;
  if new.movement_type = 'fundraising' and new.posting_identity = 'youth_voice' then
    raise exception 'Fundraising campaigns must be posted with your public profile';
  end if;
  if tg_op = 'UPDATE' and old.user_id is distinct from new.user_id then
    raise exception 'Cannot change post ownership';
  end if;
  return new;
end;
$$;
