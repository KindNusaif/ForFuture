-- Enable Supabase Realtime for live UI sync (run once in SQL Editor).
-- Dashboard alternative: Database → Replication → add tables to supabase_realtime publication.

alter publication supabase_realtime add table private.posts;
alter publication supabase_realtime add table public.poll_votes;
alter publication supabase_realtime add table public.comments;
alter publication supabase_realtime add table public.movement_follows;
