-- Youth Voice privacy hardening
-- Run AFTER youth_voice_id.sql
-- Then run fix_posts_private_schema.sql (moves posts to private + security_invoker views)

-- ---------------------------------------------------------------------------
-- 1. Enforce safe author_name and immutable ownership on posts
-- ---------------------------------------------------------------------------

create or replace function public.posts_enforce_youth_voice_privacy()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if new.posting_identity = 'youth_voice' then
    if new.youth_voice_id is null then
      raise exception 'youth_voice_id is required for youth_voice posts';
    end if;
    new.author_name := 'Youth Voice ' || new.youth_voice_id;
  end if;

  if tg_op = 'UPDATE' and old.user_id is distinct from new.user_id then
    raise exception 'Cannot change post ownership';
  end if;

  return new;
end;
$$;

drop trigger if exists posts_enforce_youth_voice_privacy on public.posts;
create trigger posts_enforce_youth_voice_privacy
  before insert or update on public.posts
  for each row
  execute function public.posts_enforce_youth_voice_privacy();

-- ---------------------------------------------------------------------------
-- 2. Public feed view — see fix_posts_private_schema.sql (security_invoker + private.posts)
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 3. Profiles — only read your own (prevents YV-ID → display_name lookup)
-- ---------------------------------------------------------------------------

drop policy if exists "Profiles are viewable by authenticated users" on public.profiles;
drop policy if exists "Users can read own profile" on public.profiles;

create policy "Users can read own profile"
  on public.profiles for select to authenticated
  using (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- 4. Posts SELECT policies — applied on private.posts in fix_posts_private_schema.sql
-- ---------------------------------------------------------------------------
