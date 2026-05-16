-- Fix: Signed-in users can execute SECURITY DEFINER function public.rls_auto_enable()
--
-- rls_auto_enable() is a Supabase internal event-trigger helper that auto-enables RLS
-- on new tables. It must run as SECURITY DEFINER for DDL, but must NOT be callable
-- via PostgREST (/rest/v1/rpc/rls_auto_enable) by anon or authenticated users.
--
-- Safe to run multiple times.

revoke execute on function public.rls_auto_enable() from public;
revoke execute on function public.rls_auto_enable() from anon, authenticated;

-- Optional: block service_role RPC too (trigger still works; not invoked via API)
revoke execute on function public.rls_auto_enable() from service_role;
