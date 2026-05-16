import type { Location } from 'react-router-dom'

export type CreateNavMode = 'movement' | 'poll'

export function getCreateNavMode(location: Pick<Location, 'pathname' | 'search'>): CreateNavMode | null {
  if (location.pathname !== '/create') return null
  const type = new URLSearchParams(location.search).get('type')
  return type === 'quick_youth_poll' ? 'poll' : 'movement'
}

export function isCreateMovementNavActive(location: Pick<Location, 'pathname' | 'search'>): boolean {
  return getCreateNavMode(location) === 'movement'
}

export function isQuickPollNavActive(location: Pick<Location, 'pathname' | 'search'>): boolean {
  return getCreateNavMode(location) === 'poll'
}
