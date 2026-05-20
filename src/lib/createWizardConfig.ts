import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  HeartHandshake,
  Lightbulb,
  Megaphone,
  Mic,
  Package,
  Scale,
  Users,
} from 'lucide-react'
import type { MovementType } from '../types'

export const CREATE_WIZARD_STEP_COUNT = 6

export type WizardTypeOption =
  | { kind: 'movement'; value: MovementType }
  | { kind: 'relief' }
  | { kind: 'poll' }

export const WIZARD_TYPE_OPTIONS: {
  option: WizardTypeOption
  label: string
  description: string
  icon: LucideIcon
}[] = [
  {
    option: { kind: 'movement', value: 'raise_voice' },
    label: 'Raise Your Voice',
    description:
      'Share an issue, concern, or lived experience that deserves attention.',
    icon: Mic,
  },
  {
    option: { kind: 'movement', value: 'youth_petition' },
    label: 'Youth Petition',
    description: 'Gather signatures and call for a clear change.',
    icon: Megaphone,
  },
  {
    option: { kind: 'movement', value: 'volunteer_drive' },
    label: 'Volunteer Drive',
    description: 'Organize people for a real community action.',
    icon: Users,
  },
  {
    option: { kind: 'relief' },
    label: 'Donation & Relief Need',
    description: 'Request urgent supplies, blood, or community support.',
    icon: Package,
  },
  {
    option: { kind: 'movement', value: 'fundraising' },
    label: 'Fundraising Campaign',
    description: 'Invite support for a trusted community cause.',
    icon: HeartHandshake,
  },
  {
    option: { kind: 'poll' },
    label: 'Community Poll',
    description: 'Ask the community for opinions on an issue.',
    icon: BarChart3,
  },
  {
    option: { kind: 'movement', value: 'idea_for_change' },
    label: 'Idea for Change',
    description: 'Share a practical solution to improve your community.',
    icon: Lightbulb,
  },
  {
    option: { kind: 'movement', value: 'peaceful_civic_action' },
    label: 'Peaceful Civic Action',
    description: 'Organize lawful awareness or peaceful community action.',
    icon: Scale,
  },
]

export const WIZARD_STEP_TITLES: Record<number, string> = {
  1: 'What kind of youth action do you want to start?',
  2: 'What area does this movement belong to?',
  3: 'Shape your movement clearly',
  4: 'Action details',
  5: 'Review how your movement will appear',
  6: 'Preview your youth movement',
}

export const WIZARD_STEP_HINTS: Record<number, string> = {
  1: 'Choose the format that best matches your goal.',
  2: 'This helps people discover and support the right causes.',
  3: 'Be clear and honest so others understand why this matters.',
  4: 'Add details specific to your action type.',
  5: 'Set visibility, safety, and confirm you are sharing in good faith.',
  6: 'Check everything looks right, then publish to the feed.',
}
