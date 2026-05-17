import { describe, expect, it } from 'vitest'
import {
  buildMovementsSearchParams,
  parseCategoryFromUrl,
  parseMovementFilterFromUrl,
} from './feedUrlFilters'

describe('feedUrlFilters', () => {
  it('parses valid category from URL', () => {
    expect(parseCategoryFromUrl('Education')).toBe('Education')
    expect(parseCategoryFromUrl('invalid')).toBe('All')
    expect(parseCategoryFromUrl(null)).toBe('All')
  })

  it('parses movement type filters', () => {
    expect(parseMovementFilterFromUrl('volunteer_drive')).toBe('volunteer_drive')
    expect(parseMovementFilterFromUrl('donation_relief_hub')).toBe('donation_relief_hub')
    expect(parseMovementFilterFromUrl('bad')).toBe('All')
  })

  it('builds search params for movements page', () => {
    const params = buildMovementsSearchParams({
      category: 'Health',
      movementFilter: 'youth_petition',
    })
    expect(params.get('category')).toBe('Health')
    expect(params.get('type')).toBe('youth_petition')
  })
})
