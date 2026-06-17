import { describe, expect, it } from 'vitest'
import { validateLogin, validateSignup } from './validation'

describe('validateSignup', () => {
  it('rejects short name', () => {
    expect(validateSignup('A', 'user@test.com', 'secret12')).toBeTruthy()
  })

  it('accepts valid signup', () => {
    expect(validateSignup('Youth Leader', 'user@test.com', 'Secret12!')).toBeNull()
  })
})

describe('validateLogin', () => {
  it('requires email and password', () => {
    expect(validateLogin('', '')).toBeTruthy()
    expect(validateLogin('user@test.com', 'password')).toBeNull()
  })
})
