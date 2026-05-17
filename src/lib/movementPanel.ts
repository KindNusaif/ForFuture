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
