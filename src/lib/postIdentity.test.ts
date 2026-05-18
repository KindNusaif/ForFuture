import { describe, expect, it } from 'vitest'
import { getPostAuthorPresentation } from './postIdentity'

describe('getPostAuthorPresentation', () => {
  it('handles youth_voice posts with null author_name and youth_voice_id', () => {
    const result = getPostAuthorPresentation({
      author_name: null as unknown as string,
      posting_identity: 'youth_voice',
      youth_voice_id: 'YV-ABCDE',
    })
    expect(result.isAnonymous).toBe(true)
    expect(result.displayName).toContain('YV-ABCDE')
  })

  it('handles youth_voice posts with null author_name and no youth_voice_id', () => {
    const result = getPostAuthorPresentation({
      author_name: null as unknown as string,
      posting_identity: 'youth_voice',
      youth_voice_id: null,
    })
    expect(result.isAnonymous).toBe(true)
    expect(result.displayName).toBe('Youth Voice')
  })

  it('handles profile posts with empty author_name', () => {
    const result = getPostAuthorPresentation({
      author_name: '',
      posting_identity: 'profile',
      youth_voice_id: null,
    })
    expect(result.displayName).toBe('Anonymous')
    expect(result.isAnonymous).toBe(false)
  })
})
