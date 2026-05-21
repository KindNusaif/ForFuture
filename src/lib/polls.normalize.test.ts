import { describe, expect, it } from 'vitest'
import { normalizePollVoteState } from './polls'

describe('normalizePollVoteState', () => {
  it('returns null for missing poll', () => {
    expect(normalizePollVoteState(null)).toBeNull()
    expect(normalizePollVoteState(undefined)).toBeNull()
  })

  it('coerces options to an array', () => {
    const result = normalizePollVoteState({
      options: undefined as unknown as [],
      totalVotes: 3,
      myVoteOptionId: null,
    })
    expect(result?.options).toEqual([])
    expect(result?.totalVotes).toBe(3)
  })
})
