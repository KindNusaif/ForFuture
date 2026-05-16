import {
  BarChart3,
  HandHeart,
  Lightbulb,
  Megaphone,
  HeartHandshake,
  Scale,
  ScrollText,
  type LucideIcon,
} from 'lucide-react'
import type { MovementType, PostActionType } from '../types'

export interface MovementTypeConfig {
  value: MovementType
  label: string
  shortLabel: string
  description: string
  icon: LucideIcon
  badgeClass: string
  actionType: PostActionType
  ctaLabel: string
  /** Short label when user has taken action (button) */
  ctaActiveLabel: string
  /** Accessible / confirmation copy */
  ctaSupportedLabel: string
  /** Microcopy under the action area */
  engagementHint: string
  /** Count line: e.g. "124 supporters" */
  countLabel: (count: number) => string
  emptyTitle: string
  emptyDescription: string
  requiresProfileIdentity: boolean
  /** Fundraising: clarify this is not payment */
  actionDisclaimer?: string
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many)

export const MOVEMENT_TO_ACTION_TYPE: Record<
  Exclude<MovementType, 'quick_youth_poll' | 'youth_petition'>,
  PostActionType
> = {
  idea_for_change: 'support_idea',
  raise_voice: 'stand_with_voice',
  volunteer_drive: 'volunteer_interest',
  fundraising: 'fundraising_support',
  peaceful_civic_action: 'join_cause',
}

export function getActionTypeForMovement(type: MovementType): PostActionType {
  if (type === 'quick_youth_poll' || type === 'youth_petition') return 'support_idea'
  return MOVEMENT_TO_ACTION_TYPE[type]
}

export function formatActionCount(type: MovementType, count: number): string {
  const cfg = getMovementConfig(type)
  return cfg.countLabel(count)
}

export function getActionSuccessMessage(type: MovementType, participating: boolean): string {
  const cfg = getMovementConfig(type)
  if (!participating) return 'You removed your participation.'
  return cfg.ctaSupportedLabel
}

export const MOVEMENT_TYPES: MovementTypeConfig[] = [
  {
    value: 'idea_for_change',
    label: 'Idea for Change',
    shortLabel: 'Ideas',
    description: 'Share a practical idea or solution that can improve society.',
    icon: Lightbulb,
    badgeClass: 'bg-amber-50 text-amber-800 ring-amber-200',
    actionType: 'support_idea',
    ctaLabel: 'Support This Idea',
    ctaActiveLabel: 'Supported',
    ctaSupportedLabel: 'You supported this idea',
    engagementHint: 'Support ideas that can shape tomorrow.',
    countLabel: (n) => `${n} ${plural(n, 'supporter', 'supporters')}`,
    emptyTitle: 'No ideas yet',
    emptyDescription: 'Be the first to share a practical idea for change.',
    requiresProfileIdentity: false,
  },
  {
    value: 'raise_voice',
    label: 'Raise Your Voice',
    shortLabel: 'Voices',
    description: 'Speak up about injustice, social problems, or issues that deserve attention.',
    icon: Megaphone,
    badgeClass: 'bg-rose-50 text-rose-800 ring-rose-200',
    actionType: 'stand_with_voice',
    ctaLabel: 'Stand With This Voice',
    ctaActiveLabel: 'Standing With This',
    ctaSupportedLabel: 'You are standing with this voice',
    engagementHint: 'Stand with voices that deserve attention.',
    countLabel: (n) =>
      `${n} ${plural(n, 'person standing with this', 'people standing with this')}`,
    emptyTitle: 'No voices raised yet',
    emptyDescription: 'Be the first to speak up about an issue that matters.',
    requiresProfileIdentity: false,
  },
  {
    value: 'volunteer_drive',
    label: 'Volunteer Drive',
    shortLabel: 'Volunteer',
    description: 'Invite youth to join a community service activity or impact event.',
    icon: HandHeart,
    badgeClass: 'bg-teal-50 text-teal-800 ring-teal-200',
    actionType: 'volunteer_interest',
    ctaLabel: 'I Want to Volunteer',
    ctaActiveLabel: 'Volunteering',
    ctaSupportedLabel: 'You expressed interest in volunteering',
    engagementHint: 'Show up for service that builds stronger communities.',
    countLabel: (n) => `${n} ${plural(n, 'volunteer interested', 'volunteers interested')}`,
    emptyTitle: 'No volunteer drives yet',
    emptyDescription: 'Be the first to organize action in your community.',
    requiresProfileIdentity: false,
  },
  {
    value: 'fundraising',
    label: 'Fundraising Campaign',
    shortLabel: 'Fundraising',
    description: 'Create a transparent cause-based fundraising campaign.',
    icon: HeartHandshake,
    badgeClass: 'bg-violet-50 text-violet-800 ring-violet-200',
    actionType: 'fundraising_support',
    ctaLabel: 'I Want to Support',
    ctaActiveLabel: 'Supporting',
    ctaSupportedLabel: 'You expressed support for this campaign',
    engagementHint: 'Show solidarity with transparent, cause-driven campaigns.',
    countLabel: (n) => `${n} ${plural(n, 'supporter', 'supporters')}`,
    actionDisclaimer: 'Expression of support — not a payment.',
    emptyTitle: 'No fundraising campaigns yet',
    emptyDescription: 'Be the first to launch a transparent cause-based campaign.',
    requiresProfileIdentity: true,
  },
  {
    value: 'peaceful_civic_action',
    label: 'Peaceful Civic Action',
    shortLabel: 'Civic Action',
    description:
      'Organize lawful awareness campaigns, peaceful gatherings, or public action for justice.',
    icon: Scale,
    badgeClass: 'bg-indigo-50 text-indigo-800 ring-indigo-200',
    actionType: 'join_cause',
    ctaLabel: 'Join the Cause',
    ctaActiveLabel: 'Joined',
    ctaSupportedLabel: 'You joined this cause',
    engagementHint: 'Participate in peaceful, lawful civic action.',
    countLabel: (n) => `${n} joined`,
    emptyTitle: 'No civic actions yet',
    emptyDescription: 'Be the first to organize peaceful, lawful civic participation.',
    requiresProfileIdentity: false,
  },
  {
    value: 'youth_petition',
    label: 'Youth Petition',
    shortLabel: 'Petitions',
    description:
      'Turn a serious concern into a collective call for change and gather youth support.',
    icon: ScrollText,
    badgeClass: 'bg-fuchsia-50 text-fuchsia-900 ring-fuchsia-200',
    actionType: 'support_idea',
    ctaLabel: 'Sign the Petition',
    ctaActiveLabel: 'Supported',
    ctaSupportedLabel: 'You have supported this petition',
    engagementHint: 'Gather community support for meaningful change.',
    countLabel: (n) => `${n} ${plural(n, 'youth supporter', 'youth supporters')}`,
    emptyTitle: 'No petitions yet',
    emptyDescription: 'Start a collective call for change.',
    requiresProfileIdentity: false,
    actionDisclaimer: 'Community advocacy — not a legally binding signature.',
  },
  {
    value: 'quick_youth_poll',
    label: 'Quick Youth Poll',
    shortLabel: 'Polls',
    description:
      'Ask the community a meaningful question and understand what youth care about.',
    icon: BarChart3,
    badgeClass: 'bg-sky-50 text-sky-800 ring-sky-200',
    actionType: 'support_idea',
    ctaLabel: 'Vote',
    ctaActiveLabel: 'Voted',
    ctaSupportedLabel: 'You voted',
    engagementHint: 'Make your voice count in the community poll.',
    countLabel: (n) => `${n} ${plural(n, 'vote', 'votes')}`,
    emptyTitle: 'No polls yet',
    emptyDescription: 'Be the first to ask the community what matters most.',
    requiresProfileIdentity: false,
  },
]

export const MOVEMENT_TYPE_VALUES = MOVEMENT_TYPES.map((m) => m.value)

export function isPollMovement(type: MovementType): boolean {
  return type === 'quick_youth_poll'
}

export function isPetitionMovementType(type: MovementType): boolean {
  return type === 'youth_petition'
}

export type MovementFilter = 'All' | MovementType

export function getMovementConfig(type: MovementType): MovementTypeConfig {
  return MOVEMENT_TYPES.find((m) => m.value === type) ?? MOVEMENT_TYPES[0]
}

export function formatEventDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null
  const d = new Date(`${dateStr}T12:00:00`)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return '—'
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}
