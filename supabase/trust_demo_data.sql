-- Demo: mark organizations / campaigns as verified (run in Supabase SQL Editor as admin)
-- Replace UUIDs with real ids from your project.

-- Verify an organization profile (by display name example)
-- update public.profiles
-- set
--   is_verified_organization = true,
--   organization_verification_type = 'ngo',
--   verified_at = now()
-- where display_name ilike '%FutureYouth%';

-- Verify by user id
-- update public.profiles
-- set
--   is_verified_organization = true,
--   organization_verification_type = 'student_society',
--   verified_at = now()
-- where id = '00000000-0000-0000-0000-000000000001';

-- Mark a fundraising campaign as trusted (private.posts — use post id from feed)
-- update private.posts
-- set
--   is_trusted_campaign = true,
--   trusted_campaign_type = 'fundraising',
--   trusted_at = now()
-- where id = '00000000-0000-0000-0000-000000000002';

-- Remove trust (admin only via SQL editor; app users cannot do this)
-- update public.profiles
-- set is_verified_organization = false, organization_verification_type = null, verified_at = null
-- where id = '...';

-- update private.posts
-- set is_trusted_campaign = false, trusted_campaign_type = null, trusted_at = null
-- where id = '...';
