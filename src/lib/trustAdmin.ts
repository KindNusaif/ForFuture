import { enhanceSupabaseError } from './supabaseErrors'
import { requireSupabase } from './supabase'
import { DEFAULT_REQUEST_TIMEOUT_MS, withTimeout } from './supabaseRequest'
import type { CampaignReviewStatus, OrganizerVerificationType, ReviewedCampaignType } from './trust'
import type { MovementType } from '../types'

export interface TrustProfileSearchResult {
  id: string
  display_name: string
  youth_voice_id: string | null
  is_verified_organizer: boolean
  organizer_verification_type: OrganizerVerificationType | null
  organizer_verified_at: string | null
}

export interface CampaignReviewQueueItem {
  post_id: string
  title: string
  movement_type: MovementType | string
  posting_identity: string
  youth_voice_id: string | null
  author_name: string | null
  review_status: CampaignReviewStatus
  reviewed_campaign_type: ReviewedCampaignType | null
  reviewed_at: string | null
  review_note: string | null
  owner_user_id: string | null
  owner_display_name: string | null
  owner_youth_voice_id: string | null
  owner_is_verified_organizer: boolean
}

function mapTrustProfile(row: Record<string, unknown>): TrustProfileSearchResult {
  return {
    id: row.id as string,
    display_name: (row.display_name as string) ?? 'Unknown',
    youth_voice_id: (row.youth_voice_id as string | null) ?? null,
    is_verified_organizer: Boolean(row.is_verified_organizer),
    organizer_verification_type:
      (row.organizer_verification_type as OrganizerVerificationType | null) ?? null,
    organizer_verified_at: (row.organizer_verified_at as string | null) ?? null,
  }
}

function mapCampaignReviewItem(row: Record<string, unknown>): CampaignReviewQueueItem {
  return {
    post_id: row.post_id as string,
    title: (row.title as string) ?? 'Untitled',
    movement_type: (row.movement_type as MovementType) ?? 'idea_for_change',
    posting_identity: (row.posting_identity as string) ?? 'profile',
    youth_voice_id: (row.youth_voice_id as string | null) ?? null,
    author_name: (row.author_name as string | null) ?? null,
    review_status: (row.review_status as CampaignReviewStatus) ?? 'unreviewed',
    reviewed_campaign_type:
      (row.reviewed_campaign_type as ReviewedCampaignType | null) ?? null,
    reviewed_at: (row.reviewed_at as string | null) ?? null,
    review_note: (row.review_note as string | null) ?? null,
    owner_user_id: (row.owner_user_id as string | null) ?? null,
    owner_display_name: (row.owner_display_name as string | null) ?? null,
    owner_youth_voice_id: (row.owner_youth_voice_id as string | null) ?? null,
    owner_is_verified_organizer: Boolean(row.owner_is_verified_organizer),
  }
}

export async function searchProfilesForTrust(query: string): Promise<TrustProfileSearchResult[]> {
  const client = requireSupabase()
  const { data, error } = await withTimeout(
    client.rpc('admin_search_profiles_for_trust', { p_query: query.trim() }),
    DEFAULT_REQUEST_TIMEOUT_MS,
  )
  if (error) throw enhanceSupabaseError(error)
  return ((data ?? []) as Record<string, unknown>[]).map(mapTrustProfile)
}

export async function updateOrganizerVerification(
  profileId: string,
  isVerified: boolean,
  verificationType?: OrganizerVerificationType | null,
): Promise<void> {
  const client = requireSupabase()
  const { error } = await withTimeout(
    client.rpc('admin_update_organizer_verification', {
      p_profile_id: profileId,
      p_is_verified: isVerified,
      p_verification_type: isVerified ? verificationType ?? null : null,
    }),
    DEFAULT_REQUEST_TIMEOUT_MS,
  )
  if (error) throw enhanceSupabaseError(error)
}

export async function fetchCampaignReviewQueue(
  status?: CampaignReviewStatus | null,
  movementType?: MovementType | null,
): Promise<CampaignReviewQueueItem[]> {
  const client = requireSupabase()
  const { data, error } = await withTimeout(
    client.rpc('admin_get_campaign_review_queue', {
      p_status: status ?? null,
      p_movement_type: movementType ?? null,
    }),
    DEFAULT_REQUEST_TIMEOUT_MS,
  )
  if (error) throw enhanceSupabaseError(error)
  return ((data ?? []) as Record<string, unknown>[]).map(mapCampaignReviewItem)
}

export async function updateCampaignReview(
  postId: string,
  reviewStatus: CampaignReviewStatus,
  reviewedCampaignType?: ReviewedCampaignType | null,
  reviewNote?: string,
): Promise<void> {
  const client = requireSupabase()
  const { error } = await withTimeout(
    client.rpc('admin_update_campaign_review', {
      p_post_id: postId,
      p_review_status: reviewStatus,
      p_reviewed_campaign_type:
        reviewStatus === 'reviewed' ? reviewedCampaignType ?? null : null,
      p_review_note: reviewNote?.trim() || null,
    }),
    DEFAULT_REQUEST_TIMEOUT_MS,
  )
  if (error) throw enhanceSupabaseError(error)
}

export const ORGANIZER_VERIFICATION_OPTIONS: {
  value: OrganizerVerificationType
  label: string
}[] = [
  { value: 'organization', label: 'Verified Organization' },
  { value: 'ngo', label: 'Verified NGO' },
  { value: 'student_society', label: 'Verified Student Society' },
  { value: 'community_partner', label: 'Community Partner' },
]

export const REVIEWED_CAMPAIGN_TYPE_OPTIONS: {
  value: ReviewedCampaignType
  label: string
}[] = [
  { value: 'fundraising', label: 'Trusted Fundraising Campaign' },
  { value: 'volunteer_drive', label: 'Verified Volunteer Drive' },
  { value: 'civic_campaign', label: 'Reviewed Civic Campaign' },
  { value: 'petition', label: 'Reviewed Petition' },
  { value: 'general_campaign', label: 'Reviewed Campaign' },
]

export const CAMPAIGN_REVIEW_STATUS_OPTIONS: {
  value: CampaignReviewStatus
  label: string
}[] = [
  { value: 'unreviewed', label: 'Unreviewed' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'rejected', label: 'Rejected' },
]
