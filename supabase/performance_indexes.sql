-- ForFuture: performance indexes for feed, filters, joins, and RLS
-- Run once in Supabase SQL Editor (safe to re-run with IF NOT EXISTS)

-- =============================================================================
-- Posts (private.posts — source table behind posts_public_safe)
-- =============================================================================

create index if not exists idx_posts_created_at_desc
  on private.posts (created_at desc);

create index if not exists idx_posts_user_id_created_at
  on private.posts (user_id, created_at desc);

create index if not exists idx_posts_movement_type_created_at
  on private.posts (movement_type, created_at desc);

create index if not exists idx_posts_category_created_at
  on private.posts (category, created_at desc);

create index if not exists idx_posts_user_id
  on private.posts (user_id);

-- RLS: auth.uid() = user_id on insert/update/delete
create index if not exists idx_posts_user_id_auth
  on private.posts (user_id)
  where user_id is not null;

-- =============================================================================
-- Supports (feed enrichment + toggle)
-- =============================================================================

create index if not exists idx_supports_post_id
  on public.supports (post_id);

create index if not exists idx_supports_user_id_post_id
  on public.supports (user_id, post_id);

-- =============================================================================
-- Polls
-- =============================================================================

create index if not exists idx_poll_options_post_id_sort
  on public.poll_options (post_id, sort_order);

create index if not exists idx_poll_votes_post_id
  on public.poll_votes (post_id);

create index if not exists idx_poll_votes_voter_post
  on public.poll_votes (voter_user_id, post_id);

-- RLS: voter_user_id = auth.uid()
create index if not exists idx_poll_votes_voter_user_id
  on public.poll_votes (voter_user_id);

-- =============================================================================
-- Profiles (auth bootstrap + verified org join on feed view)
-- =============================================================================

create index if not exists idx_profiles_youth_voice_id
  on public.profiles (youth_voice_id);

-- RLS: auth.uid() = id
create index if not exists idx_profiles_id
  on public.profiles (id);

-- Public verified-org read policy: is_verified_organization = true
create index if not exists idx_profiles_verified_org
  on public.profiles (is_verified_organization)
  where is_verified_organization = true;

-- =============================================================================
-- Optional: analyze tables after creating indexes (planner statistics)
-- =============================================================================

analyze private.posts;
analyze public.supports;
analyze public.poll_options;
analyze public.poll_votes;
analyze public.profiles;
