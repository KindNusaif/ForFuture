-- ForFuture: Allow guests (anonymous) to READ support counts
-- Run this in Supabase SQL Editor AFTER schema.sql and youth_voice_privacy.sql
-- Post reads for guests go through posts_public_safe (granted in youth_voice_privacy.sql)

-- Supports: public read (for counts on explore page)
create policy "Supports are publicly readable by guests"
  on public.supports
  for select
  to anon
  using (true);
