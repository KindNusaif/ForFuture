import { describe, expect, it } from 'vitest'
import { coerceCategory, safeArray, safeFormatShortDate } from './safeData'

describe('safeData', () => {
  it('safeArray returns [] for non-arrays', () => {
    expect(safeArray(null)).toEqual([])
    expect(safeArray({})).toEqual([])
  })

  it('coerceCategory falls back to Other', () => {
    expect(coerceCategory(null)).toBe('Other')
    expect(coerceCategory('Education')).toBe('Education')
    expect(coerceCategory('invalid')).toBe('Other')
  })

  it('safeFormatShortDate handles invalid input', () => {
    expect(safeFormatShortDate(null)).toBe('')
    expect(safeFormatShortDate('not-a-date')).toBe('')
  })
})
