import type { DonationSubtype, MovementType, Post, PostActionType } from '../types'

export type ReliefHubFilter = 'all' | 'blood_donation' | 'item_donation' | 'fundraising'

export type ReliefCreateSubtype = 'blood_donation' | 'item_donation' | 'fundraising'

export type BloodGroup =
  | 'A+'
  | 'A-'
  | 'B+'
  | 'B-'
  | 'AB+'
  | 'AB-'
  | 'O+'
  | 'O-'
  | 'any'

export type UrgencyLevel =
  | 'urgent_today'
  | 'within_24_hours'
  | 'scheduled_drive'
  | 'general_awareness'

export type ItemCategory =
  | 'school_supplies'
  | 'food_rations'
  | 'clothing'
  | 'hygiene'
  | 'books'
  | 'disaster_relief'
  | 'medical_supplies'
  | 'other_essentials'

export type ReliefStatus =
  | 'open'
  | 'donors_responding'
  | 'needed'
  | 'partially_fulfilled'
  | 'fulfilled'
  | 'closed'

export const BLOOD_GROUPS: { value: BloodGroup; labelKey: string }[] = [
  { value: 'A+', labelKey: 'relief.bloodGroups.aPositive' },
  { value: 'A-', labelKey: 'relief.bloodGroups.aNegative' },
  { value: 'B+', labelKey: 'relief.bloodGroups.bPositive' },
  { value: 'B-', labelKey: 'relief.bloodGroups.bNegative' },
  { value: 'AB+', labelKey: 'relief.bloodGroups.abPositive' },
  { value: 'AB-', labelKey: 'relief.bloodGroups.abNegative' },
  { value: 'O+', labelKey: 'relief.bloodGroups.oPositive' },
  { value: 'O-', labelKey: 'relief.bloodGroups.oNegative' },
  { value: 'any', labelKey: 'relief.bloodGroups.any' },
]

export const URGENCY_LEVELS: { value: UrgencyLevel; labelKey: string }[] = [
  { value: 'urgent_today', labelKey: 'relief.urgency.urgentToday' },
  { value: 'within_24_hours', labelKey: 'relief.urgency.within24Hours' },
  { value: 'scheduled_drive', labelKey: 'relief.urgency.scheduledDrive' },
  { value: 'general_awareness', labelKey: 'relief.urgency.generalAwareness' },
]

export const ITEM_CATEGORIES: { value: ItemCategory; labelKey: string }[] = [
  { value: 'school_supplies', labelKey: 'relief.itemCategories.schoolSupplies' },
  { value: 'food_rations', labelKey: 'relief.itemCategories.foodRations' },
  { value: 'clothing', labelKey: 'relief.itemCategories.clothing' },
  { value: 'hygiene', labelKey: 'relief.itemCategories.hygiene' },
  { value: 'books', labelKey: 'relief.itemCategories.books' },
  { value: 'disaster_relief', labelKey: 'relief.itemCategories.disasterRelief' },
  { value: 'medical_supplies', labelKey: 'relief.itemCategories.medicalSupplies' },
  { value: 'other_essentials', labelKey: 'relief.itemCategories.other' },
]

export function isReliefPost(post: Pick<Post, 'movement_type'>): boolean {
  return post.movement_type === 'donation_relief' || post.movement_type === 'fundraising'
}

export function getReliefDisplaySubtype(
  post: Pick<Post, 'movement_type' | 'donation_subtype'>,
): ReliefCreateSubtype | null {
  if (post.movement_type === 'fundraising') return 'fundraising'
  if (post.movement_type === 'donation_relief' && post.donation_subtype === 'blood_donation') {
    return 'blood_donation'
  }
  if (post.movement_type === 'donation_relief' && post.donation_subtype === 'item_donation') {
    return 'item_donation'
  }
  return null
}

export function movementTypeForReliefSubtype(subtype: ReliefCreateSubtype): MovementType {
  return subtype === 'fundraising' ? 'fundraising' : 'donation_relief'
}

export function donationSubtypeForCreate(subtype: ReliefCreateSubtype): DonationSubtype | null {
  if (subtype === 'blood_donation' || subtype === 'item_donation') return subtype
  return null
}

export function requiresProfileForReliefSubtype(subtype: ReliefCreateSubtype): boolean {
  return subtype === 'fundraising'
}

export function getActionTypeForReliefPost(
  post: Pick<Post, 'movement_type' | 'donation_subtype'>,
): PostActionType {
  if (post.movement_type === 'fundraising') return 'fundraising_support'
  if (post.donation_subtype === 'blood_donation') return 'offer_blood_donation'
  if (post.donation_subtype === 'item_donation') return 'pledge_item_donation'
  return 'volunteer_interest'
}

export function defaultReliefStatus(subtype: ReliefCreateSubtype): ReliefStatus {
  if (subtype === 'item_donation') return 'needed'
  return 'open'
}

export function reliefStatusBadgeClass(status: ReliefStatus | string | null | undefined): string {
  switch (status) {
    case 'urgent_today':
    case 'open':
    case 'needed':
      return 'bg-rose-100 text-rose-900 ring-rose-200/80'
    case 'donors_responding':
    case 'partially_fulfilled':
      return 'bg-amber-100 text-amber-900 ring-amber-200/80'
    case 'fulfilled':
      return 'bg-emerald-100 text-emerald-900 ring-emerald-200/80'
    case 'closed':
      return 'bg-slate-100 text-slate-600 ring-slate-200/80'
    default:
      return 'bg-slate-100 text-slate-700 ring-slate-200/80'
  }
}

export function urgencyBadgeClass(level: UrgencyLevel | string | null | undefined): string {
  switch (level) {
    case 'urgent_today':
      return 'bg-red-100 text-red-900 ring-red-200/80'
    case 'within_24_hours':
      return 'bg-orange-100 text-orange-900 ring-orange-200/80'
    case 'scheduled_drive':
      return 'bg-sky-100 text-sky-900 ring-sky-200/80'
    default:
      return 'bg-slate-100 text-slate-700 ring-slate-200/80'
  }
}

export function formatPledgeProgress(pledged: number, needed: number | null | undefined): string {
  if (needed == null || needed <= 0) return `${pledged} pledged`
  return `${pledged} / ${needed} pledged`
}
