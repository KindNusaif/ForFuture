import type { MovementType } from '../types'

export type MovementPanelVariant =
  | 'default'
  | 'idea'
  | 'voice'
  | 'volunteer'
  | 'fundraising'
  | 'civic'
  | 'petition'
  | 'relief'
  | 'blood'
  | 'item'
  | 'poll'

export function movementPanelClass(variant: MovementPanelVariant): string {
  return variant === 'default'
    ? 'movement-detail-panel'
    : `movement-detail-panel movement-detail-panel--${variant}`
}

export function movementTypeToPanelVariant(movementType: MovementType): MovementPanelVariant {
  switch (movementType) {
    case 'idea_for_change':
      return 'idea'
    case 'raise_voice':
      return 'voice'
    case 'volunteer_drive':
      return 'volunteer'
    case 'fundraising':
      return 'fundraising'
    case 'peaceful_civic_action':
      return 'civic'
    case 'youth_petition':
      return 'petition'
    case 'donation_relief':
      return 'relief'
    case 'quick_youth_poll':
      return 'poll'
    default:
      return 'default'
  }
}
