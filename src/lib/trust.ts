import type { MovementType, Post } from '../types'

export type OrganizerVerificationType =
  | 'organization'
  | 'ngo'
  | 'student_society'
  | 'community_partner'

/** Legacy profile / view values still returned by older rows */
export type LegacyOrganizationVerificationType =
  | OrganizerVerificationType
  | 'official_organization'

export type CampaignReviewStatus =
  | 'unreviewed'
  | 'under_review'
  | 'reviewed'
  | 'rejected'

export type ReviewedCampaignType =
  | 'fundraising'
  | 'volunteer_drive'
  | 'civic_campaign'
  | 'petition'
  | 'general_campaign'

/** Legacy trusted_campaign_type from posts_public_safe */
export type LegacyTrustedCampaignType =
  | ReviewedCampaignType
  | 'civic_action'
  | 'general_campaign'

const ORGANIZER_LABELS: Record<OrganizerVerificationType, string> = {
  organization: 'Verified Organization',
  ngo: 'Verified NGO',
  student_society: 'Verified Student Society',
  community_partner: 'Community Partner',
}

const CAMPAIGN_LABELS: Record<ReviewedCampaignType, string> = {
  fundraising: 'Trusted Fundraising Campaign',
  volunteer_drive: 'Verified Volunteer Drive',
  civic_campaign: 'Reviewed Civic Campaign',
  petition: 'Reviewed Petition',
  general_campaign: 'Reviewed Campaign',
}

export function normalizeOrganizerVerificationType(
  type: string | null | undefined,
): OrganizerVerificationType | null {
  if (!type) return null
  if (type === 'official_organization') return 'organization'
  if (type in ORGANIZER_LABELS) return type as OrganizerVerificationType
  return null
}

export function normalizeReviewedCampaignType(
  type: string | null | undefined,
  movementType?: MovementType,
): ReviewedCampaignType | null {
  if (type === 'civic_action') return 'civic_campaign'
  if (type && type in CAMPAIGN_LABELS) return type as ReviewedCampaignType
  return inferReviewedCampaignTypeFromMovement(movementType)
}

export function inferReviewedCampaignTypeFromMovement(
  movementType?: MovementType,
): ReviewedCampaignType | null {
  switch (movementType) {
    case 'fundraising':
      return 'fundraising'
    case 'volunteer_drive':
      return 'volunteer_drive'
    case 'peaceful_civic_action':
      return 'civic_campaign'
    case 'youth_petition':
      return 'petition'
    default:
      return 'general_campaign'
  }
}

export function getVerifiedOrganizerLabel(
  type: LegacyOrganizationVerificationType | string | null | undefined,
): string {
  const normalized = normalizeOrganizerVerificationType(type)
  if (!normalized) return 'Verified Organization'
  return ORGANIZER_LABELS[normalized]
}

/** @deprecated Use getVerifiedOrganizerLabel */
export const getVerifiedOrganizationLabel = getVerifiedOrganizerLabel

export function getCampaignReviewLabel(
  movementType: MovementType,
  reviewedType?: string | null,
): string {
  const type = normalizeReviewedCampaignType(reviewedType, movementType)
  if (type) return CAMPAIGN_LABELS[type]
  return CAMPAIGN_LABELS.general_campaign
}

/** @deprecated Use getCampaignReviewLabel */
export const getTrustedCampaignLabel = getCampaignReviewLabel

export function getOrganizerVerificationTooltip(
  type: LegacyOrganizationVerificationType | string | null | undefined,
): string {
  const normalized = normalizeOrganizerVerificationType(type)
  switch (normalized) {
    case 'organization':
      return 'This account has been verified by ForFuture as an organization.'
    case 'ngo':
      return 'This account has been verified by ForFuture as an NGO.'
    case 'student_society':
      return 'This account has been verified by ForFuture as a student society.'
    case 'community_partner':
      return 'This account has been verified by ForFuture as a community partner.'
    default:
      return 'This account has been verified by ForFuture as an organizer.'
  }
}

export function getCampaignReviewTooltip(
  movementType: MovementType,
  reviewedType?: string | null,
): string {
  const type = normalizeReviewedCampaignType(reviewedType, movementType)
  switch (type) {
    case 'fundraising':
      return 'This campaign has been reviewed for organizer transparency and basic campaign details. It does not guarantee outcomes or replace personal judgment.'
    case 'volunteer_drive':
      return 'This volunteer drive has been reviewed for event details, location, and organizer information.'
    case 'civic_campaign':
      return 'This campaign has been reviewed for basic transparency and platform safety. It does not mean ForFuture endorses every viewpoint expressed.'
    case 'petition':
      return 'This petition has been reviewed for basic clarity and safety standards.'
    default:
      return 'This campaign has been reviewed for basic transparency and platform safety standards.'
  }
}

export function resolveReviewStatus(
  post: Pick<Post, 'review_status' | 'is_trusted_campaign'>,
): CampaignReviewStatus {
  if (post.review_status) return post.review_status
  return post.is_trusted_campaign ? 'reviewed' : 'unreviewed'
}

export function shouldShowAuthorVerification(
  post: Pick<
    Post,
    | 'posting_identity'
    | 'author_is_verified_organizer'
    | 'author_is_verified_organization'
  >,
): boolean {
  if (post.posting_identity === 'youth_voice') return false
  return Boolean(post.author_is_verified_organizer ?? post.author_is_verified_organization)
}

export function shouldShowCampaignReview(
  post: Pick<Post, 'review_status' | 'is_trusted_campaign'>,
): boolean {
  return resolveReviewStatus(post) === 'reviewed'
}

/** @deprecated Use shouldShowCampaignReview */
export const shouldShowTrustedCampaign = shouldShowCampaignReview

export function shouldShowUnderReviewLabel(
  post: Pick<Post, 'review_status'>,
): boolean {
  return post.review_status === 'under_review'
}

export function shouldShowFundraisingNotReviewedMessage(
  post: Pick<Post, 'movement_type' | 'review_status' | 'is_trusted_campaign'>,
): boolean {
  return post.movement_type === 'fundraising' && !shouldShowCampaignReview(post)
}

export const TRUST_TOOLTIPS = {
  verifiedOrganization:
    'This account has been verified by ForFuture as an organization.',
  trustedCampaign:
    'This campaign has been reviewed for basic transparency and platform safety.',
  fundraisingNotReviewed:
    'This campaign has not yet been reviewed by ForFuture.',
} as const
