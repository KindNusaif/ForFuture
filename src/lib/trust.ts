import type { MovementType, Post } from '../types'

export type OrganizationVerificationType =
  | 'ngo'
  | 'student_society'
  | 'community_partner'
  | 'official_organization'

export type TrustedCampaignType = 'fundraising' | 'volunteer_drive' | 'civic_action' | 'general_campaign'

const ORG_LABELS: Record<OrganizationVerificationType, string> = {
  ngo: 'Verified NGO',
  student_society: 'Verified Student Society',
  community_partner: 'Community Partner',
  official_organization: 'Verified Organization',
}

export function getVerifiedOrganizationLabel(
  type: OrganizationVerificationType | string | null | undefined,
): string {
  if (!type) return 'Verified Organization'
  return ORG_LABELS[type as OrganizationVerificationType] ?? 'Verified Organization'
}

export function getTrustedCampaignLabel(
  movementType: MovementType,
  trustedType?: string | null,
): string {
  if (trustedType === 'fundraising' || movementType === 'fundraising') {
    return 'Trusted Fundraising Campaign'
  }
  if (trustedType === 'volunteer_drive' || movementType === 'volunteer_drive') {
    return 'Verified Volunteer Drive'
  }
  if (trustedType === 'civic_action' || movementType === 'peaceful_civic_action') {
    return 'Trusted Civic Campaign'
  }
  if (trustedType === 'petition' || movementType === 'youth_petition') {
    return 'Trusted Petition'
  }
  return 'Trusted Campaign'
}

export function shouldShowAuthorVerification(
  post: Pick<Post, 'posting_identity' | 'author_is_verified_organization'>,
): boolean {
  return (
    post.posting_identity !== 'youth_voice' && Boolean(post.author_is_verified_organization)
  )
}

export function shouldShowTrustedCampaign(post: Pick<Post, 'is_trusted_campaign'>): boolean {
  return Boolean(post.is_trusted_campaign)
}

export const TRUST_TOOLTIPS = {
  verifiedOrganization:
    'This organization has been reviewed and verified by the ForFuture platform team.',
  trustedCampaign:
    'This campaign has been reviewed and marked as trusted by ForFuture.',
  fundraisingNotReviewed:
    'This campaign has not been reviewed by ForFuture. Support intent only — payments are not processed on ForFuture yet.',
} as const
