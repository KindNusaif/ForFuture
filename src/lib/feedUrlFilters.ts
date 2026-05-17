import { MOVEMENT_TYPE_VALUES } from './movements'
import type { MovementFilter } from './movements'
import { CATEGORIES, type Category, type MovementType } from '../types'

export function parseCategoryFromUrl(raw: string | null): Category | 'All' {
  if (!raw) return 'All'
  return CATEGORIES.includes(raw as Category) ? (raw as Category) : 'All'
}

export function parseMovementFilterFromUrl(raw: string | null): MovementFilter {
  if (!raw) return 'All'
  if (raw === 'donation_relief_hub') return 'donation_relief_hub'
  if (MOVEMENT_TYPE_VALUES.includes(raw as MovementType)) return raw as MovementType
  return 'All'
}

export function buildMovementsSearchParams(options: {
  category: Category | 'All'
  movementFilter: MovementFilter
}): URLSearchParams {
  const params = new URLSearchParams()
  if (options.category !== 'All') params.set('category', options.category)
  if (options.movementFilter !== 'All') {
    params.set('type', options.movementFilter)
  }
  return params
}
