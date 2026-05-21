-- =============================================================================
-- ForFuture: Supabase Database Linter — RLS performance fixes
-- Run once in Supabase Dashboard → SQL Editor (after schema migrations).
-- Safe to re-run (idempotent drops + recreates).
--
-- Fixes:
--   • auth_rls_initplan — wrap auth.uid() as (select auth.uid())
--   • multiple_permissive_policies — merge overlapping SELECT/UPDATE policies
--   • duplicate_index — drop redundant poll_votes indexes
--
-- Does NOT weaken security — same rules, better planner behavior.
-- =============================================================================

-- Helper used in many policies (initplan-safe)
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
-- 1. Duplicate indexes on poll_votes
-- =============================================================================

drop index if exists public.poll_votes_post_id_idx;
drop index if exists public.poll_votes_voter_idx;

-- =============================================================================
-- 2. profiles
-- =============================================================================

alter table public.profiles enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Public can read verified organization flags" on public.profiles;
drop policy if exists "Public can read verified organizer flags" on public.profiles;
drop policy if exists "Profiles select own or verified badges" on public.profiles;

create policy "Profiles select own or verified badges"
  on public.profiles for select
  to anon, authenticated
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
-- 3. private.posts
-- =============================================================================

do $$
begin
  if exists (
    select 1 from pg_tables where schemaname = 'private' and tablename = 'posts'
  ) then
    execute 'alter table private.posts enable row level security';

    execute 'drop policy if exists "Users can read own posts from table" on private.posts';
    execute 'drop policy if exists "Posts readable via safe public view" on private.posts';
    execute 'drop policy if exists "Users can create own posts" on private.posts';
    execute 'drop policy if exists "Users can update own posts" on private.posts';
    execute 'drop policy if exists "Users can delete own posts" on private.posts';

    execute $p$
      create policy "Posts readable via safe public view"
        on private.posts for select to anon, authenticated
        using (true)
    $p$;

    execute $p$
      create policy "Users can create own posts"
        on private.posts for insert to authenticated
        with check ((select auth.uid()) = user_id)
    $p$;

    execute $p$
      create policy "Users can update own posts"
        on private.posts for update to authenticated
        using ((select auth.uid()) = user_id)
        with check ((select auth.uid()) = user_id)
    $p$;

    execute $p$
      create policy "Users can delete own posts"
        on private.posts for delete to authenticated
        using ((select auth.uid()) = user_id)
    $p$;
  end if;
end;
$$;

-- =============================================================================
-- 4. supports
-- =============================================================================

alter table if exists public.supports enable row level security;

drop policy if exists "Users can add support" on public.supports;
create policy "Users can add support"
  on public.supports for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can remove own support" on public.supports;
create policy "Users can remove own support"
  on public.supports for delete to authenticated
  using ((select auth.uid()) = user_id);

-- =============================================================================
-- 5. poll_options & poll_votes
-- =============================================================================

alter table if exists public.poll_options enable row level security;
alter table if exists public.poll_votes enable row level security;

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
-- 6. petition_signatures
-- =============================================================================

alter table if exists public.petition_signatures enable row level security;

drop policy if exists "Users sign petitions as themselves" on public.petition_signatures;
create policy "Users sign petitions as themselves"
  on public.petition_signatures for insert to authenticated
  with check ((select auth.uid()) = supporter_user_id);

-- =============================================================================
-- 7. post_actions
-- =============================================================================

alter table if exists public.post_actions enable row level security;

drop policy if exists "Users can add own post action" on public.post_actions;
create policy "Users can add own post action"
  on public.post_actions for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can remove own post action" on public.post_actions;
create policy "Users can remove own post action"
  on public.post_actions for delete to authenticated
  using ((select auth.uid()) = user_id);

-- =============================================================================
-- 8. content_reports
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

-- =============================================================================
-- 9. movement_attachments
-- =============================================================================

alter table if exists public.movement_attachments enable row level security;

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
-- 10. movement_follows
-- =============================================================================

alter table if exists public.movement_follows enable row level security;

drop policy if exists "Users can follow movements" on public.movement_follows;
create policy "Users can follow movements"
  on public.movement_follows for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can unfollow own follows" on public.movement_follows;
create policy "Users can unfollow own follows"
  on public.movement_follows for delete to authenticated
  using ((select auth.uid()) = user_id);

-- =============================================================================
-- 11. notifications
-- =============================================================================

alter table if exists public.notifications enable row level security;

drop policy if exists "Users read own notifications" on public.notifications;
create policy "Users read own notifications"
  on public.notifications for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users update own notification read state" on public.notifications;
create policy "Users update own notification read state"
  on public.notifications for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- =============================================================================
-- 12. comments (if table exists)
-- =============================================================================

do $$
begin
  if exists (
    select 1 from pg_tables where schemaname = 'public' and tablename = 'comments'
  ) then
    execute 'alter table public.comments enable row level security';

    execute 'drop policy if exists "Authenticated create comments on allowed posts" on public.comments';
    execute $p$
      create policy "Authenticated create comments on allowed posts"
        on public.comments for insert to authenticated
        with check (
          (select auth.uid()) = user_id
          and status = 'visible'
          and public.post_comments_allowed(content_id)
        )
    $p$;

    execute 'drop policy if exists "Owners update own visible comments" on public.comments';
    execute 'drop policy if exists "Admins moderate comments" on public.comments';
    execute 'drop policy if exists "Owners and admins update comments" on public.comments';
    execute $p$
      create policy "Owners and admins update comments"
        on public.comments for update to authenticated
        using (
          public.is_platform_admin()
          or ((select auth.uid()) = user_id and status = 'visible')
        )
        with check (
          public.is_platform_admin()
          or ((select auth.uid()) = user_id and status in ('visible', 'removed'))
        )
    $p$;
  end if;
end;
$$;

-- =============================================================================
-- 13. comment_reports (if table exists)
-- =============================================================================

do $$
begin
  if exists (
    select 1 from pg_tables where schemaname = 'public' and tablename = 'comment_reports'
  ) then
    execute 'alter table public.comment_reports enable row level security';

    execute 'drop policy if exists "Reporters read own comment reports" on public.comment_reports';
    execute 'drop policy if exists "Admins read all comment reports" on public.comment_reports';
    execute 'drop policy if exists "Reporters and admins read comment reports" on public.comment_reports';
    execute 'drop policy if exists "Authenticated submit comment reports" on public.comment_reports';

    execute $p$
      create policy "Authenticated submit comment reports"
        on public.comment_reports for insert to authenticated
        with check ((select auth.uid()) = reporter_id)
    $p$;

    execute $p$
      create policy "Reporters and admins read comment reports"
        on public.comment_reports for select to authenticated
        using (
          (select auth.uid()) = reporter_id
          or public.is_platform_admin()
        )
    $p$;
  end if;
end;
$$;

-- =============================================================================
-- 14. inspire_hub (if present)
-- =============================================================================

do $$
begin
  if exists (
    select 1 from pg_tables where schemaname = 'public' and tablename = 'inspire_posts'
  ) then
    execute 'drop policy if exists "Users create own inspire posts" on public.inspire_posts';
    execute 'drop policy if exists "Users update own inspire posts" on public.inspire_posts';
    execute 'drop policy if exists "Users delete own inspire posts" on public.inspire_posts';
    execute 'drop policy if exists "Users save inspire posts" on public.inspire_saves';
    execute 'drop policy if exists "Users unsave inspire posts" on public.inspire_saves';

    execute $p$
      create policy "Users create own inspire posts"
        on public.inspire_posts for insert to authenticated
        with check ((select auth.uid()) = user_id)
    $p$;

    execute $p$
      create policy "Users update own inspire posts"
        on public.inspire_posts for update to authenticated
        using ((select auth.uid()) = user_id)
        with check ((select auth.uid()) = user_id)
    $p$;

    execute $p$
      create policy "Users delete own inspire posts"
        on public.inspire_posts for delete to authenticated
        using ((select auth.uid()) = user_id)
    $p$;
  end if;

  if exists (
    select 1 from pg_tables where schemaname = 'public' and tablename = 'inspire_saves'
  ) then
    execute $p$
      create policy "Users save inspire posts"
        on public.inspire_saves for insert to authenticated
        with check ((select auth.uid()) = user_id)
    $p$;

    execute $p$
      create policy "Users unsave inspire posts"
        on public.inspire_saves for delete to authenticated
        using ((select auth.uid()) = user_id)
    $p$;
  end if;
end;
$$;

notify pgrst, 'reload schema';
