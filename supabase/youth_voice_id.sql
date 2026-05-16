-- Youth Voice ID migration
-- Run in Supabase SQL Editor after schema.sql

-- ---------------------------------------------------------------------------
-- 1. profiles.youth_voice_id
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists youth_voice_id text;

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

-- Backfill existing profiles without an ID
do $$
declare
  r record;
  candidate text;
  attempts int;
begin
  for r in select id from public.profiles where youth_voice_id is null loop
    attempts := 0;
    loop
      candidate := public.generate_youth_voice_id();
      begin
        update public.profiles
        set youth_voice_id = candidate
        where id = r.id and youth_voice_id is null;
        exit;
      exception when unique_violation then
        attempts := attempts + 1;
        if attempts > 20 then
          raise exception 'Could not assign youth_voice_id for profile %', r.id;
        end if;
      end;
    end loop;
  end loop;
end;
$$;

alter table public.profiles
  alter column youth_voice_id set not null;

create unique index if not exists profiles_youth_voice_id_key
  on public.profiles (youth_voice_id);

-- Auto-assign on new profile rows (client may also set one)
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

drop trigger if exists profiles_assign_youth_voice_id on public.profiles;
create trigger profiles_assign_youth_voice_id
  before insert on public.profiles
  for each row
  execute function public.profiles_assign_youth_voice_id();

-- ---------------------------------------------------------------------------
-- 2. posts.posting_identity + posts.youth_voice_id (snapshot at publish)
-- ---------------------------------------------------------------------------

alter table public.posts
  add column if not exists posting_identity text not null default 'profile';

alter table public.posts
  add column if not exists youth_voice_id text;

alter table public.posts
  drop constraint if exists posts_posting_identity_check;

alter table public.posts
  add constraint posts_posting_identity_check
  check (posting_identity in ('profile', 'youth_voice'));

-- Existing rows stay as profile posts
update public.posts
set posting_identity = 'profile'
where posting_identity is null;

alter table public.posts
  drop constraint if exists posts_youth_voice_snapshot_check;

alter table public.posts
  add constraint posts_youth_voice_snapshot_check
  check (
    posting_identity = 'profile'
    or (posting_identity = 'youth_voice' and youth_voice_id is not null)
  );

-- ---------------------------------------------------------------------------
-- 3. Safe public read view (optional layer for feeds / guests)
-- ---------------------------------------------------------------------------

-- Replaced by youth_voice_privacy.sql (safe view without user_id on Youth Voice posts)

-- ---------------------------------------------------------------------------
-- 4. Post ownership policies (update / delete own posts)
-- ---------------------------------------------------------------------------

drop policy if exists "Users can update own posts" on public.posts;
create policy "Users can update own posts"
  on public.posts for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own posts" on public.posts;
create policy "Users can delete own posts"
  on public.posts for delete to authenticated
  using (auth.uid() = user_id);
