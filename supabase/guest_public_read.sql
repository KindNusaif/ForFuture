-- ForFuture: Allow guests (anonymous) to READ support counts
-- Run AFTER fix_posts_private_schema.sql and youth_voice_privacy.sql
-- Post reads for guests go through posts_public_safe (granted in youth_voice_privacy.sql)
--
-- Safe to re-run: uses drop policy if exists.

grant select on public.supports to anon, authenticated;

drop policy if exists "Supports are publicly readable by guests" on public.supports;

create policy "Supports are publicly readable by guests"
  on public.supports
  for select
  to anon
  using (true);
