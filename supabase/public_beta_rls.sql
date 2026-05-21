-- ForFuture public beta: recommended Row Level Security policies
-- Run in Supabase SQL Editor AFTER schema exists (fix_missing_features.sql or APPLY_ALL_MIGRATIONS.sql).
-- Safe to re-run (drops and recreates policies by name).
--
-- Principles:
--   • Public read for published civic content (movements, polls, petitions, counts)
--   • Authenticated users insert only as themselves (auth.uid())
--   • Users update/delete only their own rows
--   • Admin-only moderation tables via is_platform_admin()
--   • Never expose private.posts via PostgREST — use posts_public_safe view only

-- =============================================================================
-- Helper: platform admin (requires content_reports.sql or equivalent)
-- =============================================================================

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = (select auth.uid())),
    false
  );
$$;

revoke all on function public.is_platform_admin() from public;
grant execute on function public.is_platform_admin() to authenticated;

-- =============================================================================
-- profiles
-- =============================================================================

alter table public.profiles enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Public can read verified organization flags" on public.profiles;
drop policy if exists "Public can read verified organizer flags" on public.profiles;
drop policy if exists "Profiles select own or verified badges" on public.profiles;
create policy "Profiles select own or verified badges"
  on public.profiles for select to anon, authenticated
  using (
    (select auth.uid()) = id
    or coalesce(is_verified_organization, false) = true
    or coalesce(is_verified_organizer, false) = true
  );

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- =============================================================================
-- private.posts (base table — not exposed in API; RLS still applies to views)
-- =============================================================================

do $$
begin
  if exists (
    select 1 from pg_tables where schemaname = 'private' and tablename = 'posts'
  ) then
    execute 'alter table private.posts enable row level security';

    execute 'drop policy if exists "Users can read own posts from table" on private.posts';
    execute 'drop policy if exists "Posts readable via safe public view" on private.posts';
    execute $p$
      create policy "Posts readable via safe public view"
        on private.posts for select to anon, authenticated
        using (true)
    $p$;

    execute 'drop policy if exists "Users can create own posts" on private.posts';
    execute $p$
      create policy "Users can create own posts"
        on private.posts for insert to authenticated
        with check ((select auth.uid()) = user_id)
    $p$;

    execute 'drop policy if exists "Users can update own posts" on private.posts';
    execute $p$
      create policy "Users can update own posts"
        on private.posts for update to authenticated
        using ((select auth.uid()) = user_id)
        with check ((select auth.uid()) = user_id)
    $p$;

    execute 'drop policy if exists "Users can delete own posts" on private.posts';
    execute $p$
      create policy "Users can delete own posts"
        on private.posts for delete to authenticated
        using ((select auth.uid()) = user_id)
    $p$;
  end if;
end;
$$;

-- =============================================================================
-- poll_options & poll_votes
-- =============================================================================

alter table if exists public.poll_options enable row level security;
alter table if exists public.poll_votes enable row level security;

drop policy if exists "Poll options are publicly readable" on public.poll_options;
create policy "Poll options are publicly readable"
  on public.poll_options for select to anon, authenticated
  using (true);

drop policy if exists "Poll creators can add options" on public.poll_options;
create policy "Poll creators can add options"
  on public.poll_options for insert to authenticated
  with check (
    exists (
      select 1 from private.posts p
      where p.id = post_id and p.user_id = (select auth.uid())
    )
  );

drop policy if exists "Poll owners can delete options" on public.poll_options;
create policy "Poll owners can delete options"
  on public.poll_options for delete to authenticated
  using (
    exists (
      select 1 from private.posts p
      where p.id = post_id and p.user_id = (select auth.uid())
    )
  );

drop policy if exists "Poll votes publicly readable" on public.poll_votes;
create policy "Poll votes publicly readable"
  on public.poll_votes for select to anon, authenticated
  using (true);

drop policy if exists "Users can read own poll votes" on public.poll_votes;

drop policy if exists "Authenticated users can vote once per poll" on public.poll_votes;
create policy "Authenticated users can vote once per poll"
  on public.poll_votes for insert to authenticated
  with check (
    voter_user_id = (select auth.uid())
    and exists (
      select 1 from public.poll_options o
      where o.id = option_id and o.post_id = post_id
    )
    and exists (
      select 1 from private.posts p
      where p.id = post_id and p.movement_type = 'quick_youth_poll'
    )
  );

-- =============================================================================
-- petition_signatures
-- =============================================================================

alter table if exists public.petition_signatures enable row level security;

drop policy if exists "Petition signatures readable by everyone" on public.petition_signatures;
create policy "Petition signatures readable by everyone"
  on public.petition_signatures for select to anon, authenticated
  using (true);

drop policy if exists "Users sign petitions as themselves" on public.petition_signatures;
create policy "Users sign petitions as themselves"
  on public.petition_signatures for insert to authenticated
  with check ((select auth.uid()) = supporter_user_id);

-- =============================================================================
-- post_actions (civic engagement)
-- =============================================================================

alter table if exists public.post_actions enable row level security;

drop policy if exists "Post actions readable by authenticated" on public.post_actions;
create policy "Post actions readable by authenticated"
  on public.post_actions for select to authenticated
  using (true);

drop policy if exists "Post actions publicly readable by guests" on public.post_actions;
create policy "Post actions publicly readable by guests"
  on public.post_actions for select to anon
  using (true);

drop policy if exists "Users can add own post action" on public.post_actions;
create policy "Users can add own post action"
  on public.post_actions for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can remove own post action" on public.post_actions;
create policy "Users can remove own post action"
  on public.post_actions for delete to authenticated
  using ((select auth.uid()) = user_id);

-- =============================================================================
-- supports (legacy — keep read-only engagement counts for guests)
-- =============================================================================

alter table if exists public.supports enable row level security;

drop policy if exists "Supports are viewable by authenticated users" on public.supports;
create policy "Supports are viewable by authenticated users"
  on public.supports for select to authenticated
  using (true);

drop policy if exists "Supports are publicly readable by guests" on public.supports;
create policy "Supports are publicly readable by guests"
  on public.supports for select to anon
  using (true);

drop policy if exists "Users can add support" on public.supports;
create policy "Users can add support"
  on public.supports for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can remove own support" on public.supports;
create policy "Users can remove own support"
  on public.supports for delete to authenticated
  using ((select auth.uid()) = user_id);

-- =============================================================================
-- movement_attachments
-- =============================================================================

alter table if exists public.movement_attachments enable row level security;

drop policy if exists "Movement attachments are publicly readable" on public.movement_attachments;
create policy "Movement attachments are publicly readable"
  on public.movement_attachments for select to anon, authenticated
  using (true);

drop policy if exists "Users insert attachments for own movements" on public.movement_attachments;
create policy "Users insert attachments for own movements"
  on public.movement_attachments for insert to authenticated
  with check (
    exists (
      select 1 from private.posts p
      where p.id = movement_id and p.user_id = (select auth.uid())
    )
  );

drop policy if exists "Users delete own attachments" on public.movement_attachments;
create policy "Users delete own attachments"
  on public.movement_attachments for delete to authenticated
  using (
    exists (
      select 1 from private.posts p
      where p.id = movement_id and p.user_id = (select auth.uid())
    )
  );

-- =============================================================================
-- content_reports
-- =============================================================================

alter table if exists public.content_reports enable row level security;

drop policy if exists "Users insert own content reports" on public.content_reports;
create policy "Users insert own content reports"
  on public.content_reports for insert to authenticated
  with check ((select auth.uid()) = reporter_user_id);

drop policy if exists "Users read own content reports" on public.content_reports;
drop policy if exists "Admins read all content reports" on public.content_reports;
drop policy if exists "Users and admins read content reports" on public.content_reports;
create policy "Users and admins read content reports"
  on public.content_reports for select to authenticated
  using (
    (select auth.uid()) = reporter_user_id
    or public.is_platform_admin()
  );

drop policy if exists "Admins update content reports" on public.content_reports;
create policy "Admins update content reports"
  on public.content_reports for update to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- =============================================================================
-- Grants (anon read public content; authenticated write own rows)
-- =============================================================================

grant select on public.poll_options to anon, authenticated;
grant insert, delete on public.poll_options to authenticated;

grant select on public.poll_votes to anon, authenticated;
grant insert on public.poll_votes to authenticated;

grant select on public.petition_signatures to anon, authenticated;
grant insert on public.petition_signatures to authenticated;

grant select, insert, delete on public.post_actions to authenticated;
grant select on public.post_actions to anon;

grant select, insert, delete on public.supports to authenticated;
grant select on public.supports to anon;

grant select on public.movement_attachments to anon, authenticated;
grant insert, delete on public.movement_attachments to authenticated;

grant select, insert on public.content_reports to authenticated;

notify pgrst, 'reload schema';
