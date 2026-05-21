import type { MovementType } from '../types'

export interface MovementVisualStyle {
  accentBar: string
  headerWash: string
  iconChip: string
  sectionPanel: string
  actionZone: string
}

export const MOVEMENT_VISUAL: Record<MovementType, MovementVisualStyle> = {
  idea_for_change: {
    accentBar: 'border-l-amber-400',
    headerWash: 'from-amber-50/70 via-white to-white',
    iconChip: 'bg-amber-100 text-amber-700 ring-amber-200/80',
    sectionPanel: 'border-amber-100/90 bg-amber-50/40',
    actionZone: 'border-amber-100/80 bg-linear-to-br from-amber-50/30 to-white',
  },
  raise_voice: {
    accentBar: 'border-l-violet-500',
    headerWash: 'from-violet-50/70 via-white to-white',
    iconChip: 'bg-violet-100 text-violet-700 ring-violet-200/80',
    sectionPanel: 'border-violet-100/90 bg-violet-50/40',
    actionZone: 'border-violet-100/80 bg-linear-to-br from-violet-50/30 to-white',
  },
  volunteer_drive: {
    accentBar: 'border-l-teal-500',
    headerWash: 'from-teal-50/70 via-white to-white',
    iconChip: 'bg-teal-100 text-teal-700 ring-teal-200/80',
    sectionPanel: 'border-teal-100/90 bg-teal-50/35',
    actionZone: 'border-teal-100/80 bg-linear-to-br from-teal-50/30 to-white',
  },
  fundraising: {
    accentBar: 'border-l-sky-500',
    headerWash: 'from-sky-50/70 via-white to-white',
    iconChip: 'bg-sky-100 text-sky-700 ring-sky-200/80',
    sectionPanel: 'border-sky-100/90 bg-sky-50/40',
    actionZone: 'border-sky-100/80 bg-linear-to-br from-sky-50/30 to-white',
  },
  peaceful_civic_action: {
    accentBar: 'border-l-orange-500',
    headerWash: 'from-orange-50/70 via-white to-white',
    iconChip: 'bg-orange-100 text-orange-700 ring-orange-200/80',
    sectionPanel: 'border-orange-100/90 bg-orange-50/40',
    actionZone: 'border-orange-100/80 bg-linear-to-br from-orange-50/30 to-white',
  },
  youth_petition: {
    accentBar: 'border-l-fuchsia-500',
    headerWash: 'from-fuchsia-50/70 via-white to-white',
    iconChip: 'bg-fuchsia-100 text-fuchsia-800 ring-fuchsia-200/80',
    sectionPanel: 'border-fuchsia-100/90 bg-fuchsia-50/40',
    actionZone: 'border-fuchsia-100/80 bg-linear-to-br from-fuchsia-50/30 to-white',
  },
  donation_relief: {
    accentBar: 'border-l-rose-500',
    headerWash: 'from-rose-50/70 via-white to-white',
    iconChip: 'bg-rose-100 text-rose-800 ring-rose-200/80',
    sectionPanel: 'border-rose-100/90 bg-rose-50/40',
    actionZone: 'border-rose-100/80 bg-linear-to-br from-rose-50/30 to-white',
  },
  quick_youth_poll: {
    accentBar: 'border-l-cyan-500',
    headerWash: 'from-cyan-50/60 via-white to-white',
    iconChip: 'bg-cyan-100 text-cyan-800 ring-cyan-200/80',
    sectionPanel: 'border-cyan-100/90 bg-cyan-50/35',
    actionZone: 'border-cyan-100/80 bg-linear-to-br from-cyan-50/25 to-white',
  },
}

const DEFAULT_MOVEMENT_VISUAL = MOVEMENT_VISUAL.idea_for_change

export function getMovementVisual(type: MovementType | string | null | undefined): MovementVisualStyle {
  if (type && type in MOVEMENT_VISUAL) {
    return MOVEMENT_VISUAL[type as MovementType]
  }
  return DEFAULT_MOVEMENT_VISUAL
}

/** Show momentum pill when engagement is meaningfully active (real counts only). */
export function shouldShowMomentumPill(
  movementType: MovementType,
  supportCount: number,
  pollVotes?: number,
): boolean {
  if (movementType === 'quick_youth_poll') {
    return (pollVotes ?? 0) >= 5
  }
  if (movementType === 'youth_petition') {
    return supportCount >= 10
  }
  return supportCount >= 5
}

export function getMomentumLabel(
  movementType: MovementType,
  supportCount: number,
  pollVotes?: number,
): string {
  if (movementType === 'quick_youth_poll') {
    return `${pollVotes ?? 0} votes`
  }
  if (movementType === 'youth_petition') {
    if (supportCount >= 100) return 'Strong support'
    if (supportCount >= 25) return 'Growing petition'
    return ''
  }
  if (supportCount >= 25) return 'Growing momentum'
  if (supportCount >= 5) return 'Active now'
  return ''
}
