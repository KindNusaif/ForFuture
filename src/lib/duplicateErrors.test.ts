import { describe, expect, it } from 'vitest'
import {
  DUPLICATE_PETITION_MESSAGE,
  DUPLICATE_POLL_VOTE_MESSAGE,
  mapDuplicateActionError,
} from './duplicateErrors'

describe('mapDuplicateActionError', () => {
  it('maps petition unique violation', () => {
    const err = mapDuplicateActionError({ code: '23505' }, 'petition')
    expect(err.message).toBe(DUPLICATE_PETITION_MESSAGE)
  })

  it('maps poll unique violation', () => {
    const err = mapDuplicateActionError({ code: '23505' }, 'poll')
    expect(err.message).toBe(DUPLICATE_POLL_VOTE_MESSAGE)
  })

  it('passes through non-duplicate errors', () => {
    const original = new Error('Network failed')
    expect(mapDuplicateActionError(original, 'poll')).toBe(original)
  })
})
