import { describe, expect, it } from 'vitest'
import { coerceMovementType } from './movements'
import { getMovementVisual } from './movementVisual'

describe('movement render guards', () => {
  it('coerceMovementType falls back for unknown values', () => {
    expect(coerceMovementType(null)).toBe('idea_for_change')
    expect(coerceMovementType('not_a_real_type')).toBe('idea_for_change')
    expect(coerceMovementType('quick_youth_poll')).toBe('quick_youth_poll')
  })

  it('getMovementVisual never returns undefined', () => {
    expect(getMovementVisual('bad_type')).toMatchObject({ accentBar: expect.any(String) })
    expect(getMovementVisual(undefined)).toMatchObject({ accentBar: expect.any(String) })
    expect(getMovementVisual('quick_youth_poll').accentBar).toContain('cyan')
  })
})
