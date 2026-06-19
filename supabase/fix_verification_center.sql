-- =============================================================================
-- ForFuture: FIX VERIFICATION CENTER (organization verification applications)
-- Supabase Dashboard → SQL Editor → paste → Run → hard-refresh app (Ctrl+Shift+R)
-- Safe to re-run (idempotent)
--
-- Run when Verification Center shows "database setup is incomplete" on submit.
-- Also included in supabase/APPLY_ALL_MIGRATIONS.sql and verified_relief_ecosystem.sql.
-- =============================================================================

-- Organization verification applications
create table if not exists public.organization_verification_requests (
  id uuid primary key default gen_random_uuid(),
  applicant_user_id uuid not null references public.profiles (id) on delete cascade,
  organization_name text not null,
  organization_type text not null,
  mission text not null,
  contact_name text not null,
  contact_email text not null,
  contact_phone text,
  operating_area text,
  website_url text,
  social_links text,
  registration_reference text,
  status text not null default 'draft',
  applicant_note text,
  admin_note text,
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint org_verification_type_check check (
    organization_type in ('ngo', 'charity', 'nonprofit', 'youth_organization', 'community_group', 'other')
  ),
  constraint org_verification_status_check check (
    status in ('draft', 'submitted', 'under_review', 'needs_changes', 'approved', 'rejected')
  )
);

create index if not exists idx_org_verification_applicant
  on public.organization_verification_requests (applicant_user_id);

create index if not exists idx_org_verification_status
  on public.organization_verification_requests (status, created_at desc);

alter table public.organization_verification_requests enable row level security;

drop policy if exists org_verification_select_own on public.organization_verification_requests;
create policy org_verification_select_own on public.organization_verification_requests
  for select to authenticated
  using (applicant_user_id = auth.uid() or public.is_platform_admin());

drop policy if exists org_verification_insert_own on public.organization_verification_requests;
create policy org_verification_insert_own on public.organization_verification_requests
  for insert to authenticated
  with check (applicant_user_id = auth.uid());

drop policy if exists org_verification_update_own_draft on public.organization_verification_requests;
create policy org_verification_update_own_draft on public.organization_verification_requests
  for update to authenticated
  using (
    applicant_user_id = auth.uid()
    and status in ('draft', 'needs_changes')
  )
  with check (applicant_user_id = auth.uid());

-- Admin RPCs — organization verification queue
create or replace function public.admin_get_org_verification_queue(p_status text default null)
returns setof public.organization_verification_requests
language sql
security definer
set search_path = pg_catalog, public
as $$
  select *
  from public.organization_verification_requests r
  where public.is_platform_admin()
    and (p_status is null or p_status = '' or r.status = p_status)
  order by r.created_at desc
  limit 200;
$$;

create or replace function public.admin_update_org_verification(
  p_request_id uuid,
  p_status text,
  p_admin_note text default null,
  p_grant_verification boolean default false,
  p_verification_type text default 'organization'
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_row public.organization_verification_requests%rowtype;
begin
  if not public.is_platform_admin() then
    raise exception 'Not authorized';
  end if;

  select * into v_row from public.organization_verification_requests where id = p_request_id;
  if not found then
    raise exception 'Request not found';
  end if;

  update public.organization_verification_requests
  set
    status = p_status,
    admin_note = coalesce(p_admin_note, admin_note),
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    updated_at = now()
  where id = p_request_id;

  if p_grant_verification and p_status = 'approved' then
    update public.profiles
    set
      is_verified_organizer = true,
      organizer_verification_type = coalesce(p_verification_type, 'organization'),
      organizer_verified_at = now()
    where id = v_row.applicant_user_id;
  end if;
end;
$$;

revoke all on function public.admin_get_org_verification_queue(text) from public;
revoke all on function public.admin_update_org_verification(uuid, text, text, boolean, text) from public;
grant execute on function public.admin_get_org_verification_queue(text) to authenticated;
grant execute on function public.admin_update_org_verification(uuid, text, text, boolean, text) to authenticated;

notify pgrst, 'reload schema';
