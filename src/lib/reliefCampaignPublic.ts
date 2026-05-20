import type { Post, Profile } from '../types'
import { getReliefDisplaySubtype, isReliefPost } from './reliefHub'

export type PublicationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'published'
  | 'needs_changes'
  | 'rejected'
  | 'paused'
  | 'completed'

export type DonationMethod = 'external_link' | 'contact_organizer' | 'interest_only'

export type ReliefHubTab =
  | 'all'
  | 'urgent'
  | 'monetary'
  | 'supplies'
  | 'volunteer'
  | 'verified_orgs'
  | 'my_campaigns'

export function isVerifiedOrganizer(profile: Pick<Profile, 'is_verified_organizer' | 'is_verified_organization'> | null | undefined): boolean {
  return Boolean(profile?.is_verified_organizer || profile?.is_verified_organization)
}

export function canCreateFundraisingCampaign(profile: Profile | null | undefined): boolean {
  return isVerifiedOrganizer(profile)
}

export function isPublicReliefCampaign(post: Pick<Post, 'movement_type' | 'review_status' | 'publication_status'>): boolean {
  if (!isReliefPost(post)) return false
  const pub = post.publication_status ?? 'published'
  if (!['published', 'completed'].includes(pub)) return false
  if (post.movement_type === 'fundraising' && post.review_status !== 'reviewed') return false
  return true
}

export function reliefTabToFilters(tab: ReliefHubTab): {
  reliefSubtype?: 'all' | 'blood_donation' | 'item_donation' | 'fundraising'
  urgentOnly?: boolean
  verifiedOnly?: boolean
} {
  switch (tab) {
    case 'monetary':
      return { reliefSubtype: 'fundraising' }
    case 'supplies':
      return { reliefSubtype: 'item_donation' }
    case 'urgent':
      return { reliefSubtype: 'all', urgentOnly: true }
    case 'verified_orgs':
      return { reliefSubtype: 'all', verifiedOnly: true }
    default:
      return { reliefSubtype: 'all' }
  }
}

export function matchesReliefTab(
  post: Post,
  tab: ReliefHubTab,
  options?: { ownerUserId?: string | null },
): boolean {
  if (!isReliefPost(post)) return false
  if (tab === 'my_campaigns') {
    return options?.ownerUserId != null && post.user_id === options.ownerUserId
  }
  if (tab === 'volunteer') return false
  const { reliefSubtype, urgentOnly, verifiedOnly } = reliefTabToFilters(tab)
  if (verifiedOnly && !post.author_is_verified_organizer && !post.author_is_verified_organization) {
    return false
  }
  if (urgentOnly) {
    const urgent =
      post.urgency_level === 'urgent_today' ||
      post.urgency_level === 'within_24_hours' ||
      post.relief_status === 'needed' ||
      post.relief_status === 'open'
    if (!urgent) return false
  }
  if (reliefSubtype === 'all') return true
  const display = getReliefDisplaySubtype(post)
  return display === reliefSubtype
}

export function campaignSupportActions(post: Post): {
  donate: boolean
  supplies: boolean
  volunteer: boolean
  share: boolean
} {
  const subtype = getReliefDisplaySubtype(post)
  return {
    donate: subtype === 'fundraising',
    supplies: subtype === 'item_donation',
    volunteer: false,
    share: true,
  }
}

export function donationMethodLabel(method: DonationMethod | string | null | undefined): string {
  switch (method) {
    case 'external_link':
      return 'external_link'
    case 'contact_organizer':
      return 'contact_organizer'
    default:
      return 'interest_only'
  }
}
