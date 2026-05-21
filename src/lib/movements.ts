import type { LucideIcon } from 'lucide-react'
import i18n from '../i18n'
import type { MovementType, PostActionType } from '../types'
import { MOVEMENT_TYPES_BASE } from './movementBase'
import { buildMovementConfig } from './movementI18n'

export type { MovementTypeStaticConfig } from './movementBase'
export { MOVEMENT_TYPES_BASE } from './movementBase'

export interface MovementTypeConfig {
  value: MovementType
  label: string
  shortLabel: string
  description: string
  icon: LucideIcon
  badgeClass: string
  actionType: PostActionType
  ctaLabel: string
  ctaActiveLabel: string
  ctaSupportedLabel: string
  engagementHint: string
  countLabel: (count: number) => string
  emptyTitle: string
  emptyDescription: string
  requiresProfileIdentity: boolean
  actionDisclaimer?: string
}

export const MOVEMENT_TO_ACTION_TYPE: Record<
  Exclude<MovementType, 'quick_youth_poll' | 'youth_petition' | 'donation_relief'>,
  PostActionType
> = {
  idea_for_change: 'support_idea',
  raise_voice: 'stand_with_voice',
  volunteer_drive: 'volunteer_interest',
  fundraising: 'fundraising_support',
  peaceful_civic_action: 'join_cause',
}

export const MOVEMENT_TYPE_VALUES = MOVEMENT_TYPES_BASE.map((m) => m.value)

const MOVEMENT_TYPE_SET = new Set<string>(MOVEMENT_TYPE_VALUES)

/** Coerce unknown DB/API values to a known movement type (prevents render crashes). */
export function coerceMovementType(raw: unknown): MovementType {
  if (typeof raw === 'string' && MOVEMENT_TYPE_SET.has(raw)) {
    return raw as MovementType
  }
  return 'idea_for_change'
}

export function getActionTypeForMovement(
  type: MovementType,
  donationSubtype?: string | null,
): PostActionType {
  if (type === 'quick_youth_poll' || type === 'youth_petition') return 'support_idea'
  if (type === 'donation_relief') {
    if (donationSubtype === 'blood_donation') return 'offer_blood_donation'
    if (donationSubtype === 'item_donation') return 'pledge_item_donation'
    return 'volunteer_interest'
  }
  return MOVEMENT_TO_ACTION_TYPE[type as keyof typeof MOVEMENT_TO_ACTION_TYPE]
}

export function getMovementConfig(type: MovementType | string | null | undefined): MovementTypeConfig {
  return buildMovementConfig(coerceMovementType(type), i18n.t.bind(i18n))
}

export function getMovementTypes(): MovementTypeConfig[] {
  return MOVEMENT_TYPE_VALUES.map((value) => getMovementConfig(value))
}

export function formatActionCount(type: MovementType | string | null | undefined, count: number): string {
  return getMovementConfig(type).countLabel(count)
}

export function getActionSuccessMessage(
  type: MovementType | string | null | undefined,
  participating: boolean,
): string {
  if (!participating) return i18n.t('movements.removedParticipation')
  return getMovementConfig(type).ctaSupportedLabel
}

export function isPollMovement(type: MovementType): boolean {
  return type === 'quick_youth_poll'
}

export function isPetitionMovementType(type: MovementType): boolean {
  return type === 'youth_petition'
}

export type MovementFilter = 'All' | MovementType | 'donation_relief_hub'

export function formatEventDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null
  const d = new Date(`${dateStr}T12:00:00`)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString(i18n.language, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return '—'
  return new Intl.NumberFormat(i18n.language, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

export { buildMovementConfig } from './movementI18n'
