import {
  BarChart3,
  Droplet,
  HandHeart,
  Lightbulb,
  Megaphone,
  HeartHandshake,
  Scale,
  ScrollText,
  type LucideIcon,
} from 'lucide-react'
import type { MovementType, PostActionType } from '../types'

export interface MovementTypeStaticConfig {
  value: MovementType
  icon: LucideIcon
  badgeClass: string
  actionType: PostActionType
  requiresProfileIdentity: boolean
}

export const MOVEMENT_TYPES_BASE: MovementTypeStaticConfig[] = [
  {
    value: 'idea_for_change',
    icon: Lightbulb,
    badgeClass: 'bg-amber-50 text-amber-800 ring-amber-200',
    actionType: 'support_idea',
    requiresProfileIdentity: false,
  },
  {
    value: 'raise_voice',
    icon: Megaphone,
    badgeClass: 'bg-rose-50 text-rose-800 ring-rose-200',
    actionType: 'stand_with_voice',
    requiresProfileIdentity: false,
  },
  {
    value: 'volunteer_drive',
    icon: HandHeart,
    badgeClass: 'bg-teal-50 text-teal-800 ring-teal-200',
    actionType: 'volunteer_interest',
    requiresProfileIdentity: false,
  },
  {
    value: 'fundraising',
    icon: HeartHandshake,
    badgeClass: 'bg-violet-50 text-violet-800 ring-violet-200',
    actionType: 'fundraising_support',
    requiresProfileIdentity: true,
  },
  {
    value: 'peaceful_civic_action',
    icon: Scale,
    badgeClass: 'bg-indigo-50 text-indigo-800 ring-indigo-200',
    actionType: 'join_cause',
    requiresProfileIdentity: false,
  },
  {
    value: 'youth_petition',
    icon: ScrollText,
    badgeClass: 'bg-fuchsia-50 text-fuchsia-900 ring-fuchsia-200',
    actionType: 'support_idea',
    requiresProfileIdentity: false,
  },
  {
    value: 'quick_youth_poll',
    icon: BarChart3,
    badgeClass: 'bg-sky-50 text-sky-800 ring-sky-200',
    actionType: 'support_idea',
    requiresProfileIdentity: false,
  },
  {
    value: 'donation_relief',
    icon: Droplet,
    badgeClass: 'bg-rose-50 text-rose-900 ring-rose-200',
    actionType: 'offer_blood_donation',
    requiresProfileIdentity: false,
  },
]
