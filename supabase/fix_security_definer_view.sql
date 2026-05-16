-- Quick fix: Security Definer View on public.posts_public_safe
-- Run in Supabase SQL Editor (safe to re-run).
-- Full schema fix is in 00_fix_all.sql section 5 or fix_posts_private_schema.sql.

\ir fix_posts_private_schema.sql
