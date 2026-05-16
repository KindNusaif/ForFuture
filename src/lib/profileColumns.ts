export const PROFILE_COLUMNS = [
  'id',
  'display_name',
  'youth_voice_id',
  'bio',
  'avatar_url',
  'created_at',
  'is_verified_organizer',
  'organizer_verification_type',
  'organizer_verified_at',
  'is_verified_organization',
  'organization_verification_type',
  'verified_at',
  'is_admin',
  'appearance_mode',
  'visual_comfort_enabled',
  'reduce_motion_enabled',
].join(', ')

/** Without moderation / verification columns (older databases). */
export const PROFILE_COLUMNS_LEGACY = [
  'id',
  'display_name',
  'youth_voice_id',
  'bio',
  'avatar_url',
  'created_at',
].join(', ')

/** Minimal profile row when youth_voice_id is not migrated yet. */
export const PROFILE_COLUMNS_MINIMAL = ['id', 'display_name', 'created_at'].join(', ')
