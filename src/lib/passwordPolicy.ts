/**
 * Client-side password rules for signup and password reset.
 *
 * MUST stay aligned with Supabase Dashboard → Authentication → Providers → Email
 * → Password security (minimum length, character requirements, leaked-password protection).
 *
 * @see https://supabase.com/docs/guides/auth/password-security
 */

export const PASSWORD_POLICY = {
  minLength: 8,
  maxLength: 72,
  requireLowercase: true,
  requireUppercase: true,
  requireDigit: true,
  /** Set true only if Supabase dashboard requires special characters */
  requireSpecial: false,
} as const

export type PasswordStrengthTier = 'empty' | 'weak' | 'fair' | 'strong'

export type PasswordRuleId =
  | 'minLength'
  | 'lowercase'
  | 'uppercase'
  | 'digit'
  | 'special'
  | 'ready'

export interface PasswordRuleStatus {
  id: PasswordRuleId
  met: boolean
  labelKey: string
  labelDefault: string
  required: boolean
}

const WORD_A = [
  'Cobalt',
  'River',
  'Summit',
  'Harbor',
  'Meadow',
  'Lantern',
  'Pioneer',
  'Horizon',
  'Cedar',
  'Aurora',
] as const

const WORD_B = [
  'Voice',
  'Bridge',
  'Garden',
  'Signal',
  'Future',
  'Spirit',
  'Motion',
  'Beacon',
  'Path',
  'Unity',
] as const

function hasLower(s: string) {
  return /[a-z]/.test(s)
}

function hasUpper(s: string) {
  return /[A-Z]/.test(s)
}

function hasDigit(s: string) {
  return /\d/.test(s)
}

function hasSpecial(s: string) {
  return /[^A-Za-z0-9]/.test(s)
}

export function getPasswordRuleStatuses(password: string): PasswordRuleStatus[] {
  const rules: PasswordRuleStatus[] = [
    {
      id: 'minLength',
      met: password.length >= PASSWORD_POLICY.minLength,
      labelKey: 'auth.passwordRuleMinLength',
      labelDefault: `At least ${PASSWORD_POLICY.minLength} characters`,
      required: true,
    },
  ]

  if (PASSWORD_POLICY.requireLowercase) {
    rules.push({
      id: 'lowercase',
      met: hasLower(password),
      labelKey: 'auth.passwordRuleLower',
      labelDefault: 'Includes a lowercase letter',
      required: true,
    })
  }

  if (PASSWORD_POLICY.requireUppercase) {
    rules.push({
      id: 'uppercase',
      met: hasUpper(password),
      labelKey: 'auth.passwordRuleUpper',
      labelDefault: 'Includes an uppercase letter',
      required: true,
    })
  }

  if (PASSWORD_POLICY.requireDigit) {
    rules.push({
      id: 'digit',
      met: hasDigit(password),
      labelKey: 'auth.passwordRuleDigit',
      labelDefault: 'Includes a number',
      required: true,
    })
  }

  if (PASSWORD_POLICY.requireSpecial) {
    rules.push({
      id: 'special',
      met: hasSpecial(password),
      labelKey: 'auth.passwordRuleSpecial',
      labelDefault: 'Includes a symbol',
      required: true,
    })
  } else {
    rules.push({
      id: 'special',
      met: hasSpecial(password),
      labelKey: 'auth.passwordRuleSpecialOptional',
      labelDefault: 'Symbol recommended (optional)',
      required: false,
    })
  }

  const requiredMet = rules.filter((r) => r.required).every((r) => r.met)
  rules.push({
    id: 'ready',
    met: requiredMet && password.length > 0,
    labelKey: 'auth.passwordRuleReady',
    labelDefault: 'Ready to create account',
    required: true,
  })

  return rules
}

export function isPasswordPolicyMet(password: string): boolean {
  if (!password) return false
  if (password.length < PASSWORD_POLICY.minLength || password.length > PASSWORD_POLICY.maxLength) {
    return false
  }
  if (PASSWORD_POLICY.requireLowercase && !hasLower(password)) return false
  if (PASSWORD_POLICY.requireUppercase && !hasUpper(password)) return false
  if (PASSWORD_POLICY.requireDigit && !hasDigit(password)) return false
  if (PASSWORD_POLICY.requireSpecial && !hasSpecial(password)) return false
  return true
}

export function getPasswordStrengthTier(password: string): PasswordStrengthTier {
  if (!password) return 'empty'
  const rules = getPasswordRuleStatuses(password)
  const required = rules.filter((r) => r.required && r.id !== 'ready')
  const metCount = required.filter((r) => r.met).length
  if (metCount === 0) return 'weak'
  if (!isPasswordPolicyMet(password)) {
    return metCount >= required.length - 1 ? 'fair' : 'weak'
  }
  if (password.length >= 12 && hasSpecial(password)) return 'strong'
  return 'fair'
}

/** User-facing message when submit blocked by local policy */
export function passwordPolicySubmitMessage(): string {
  const parts = [`at least ${PASSWORD_POLICY.minLength} characters`]
  if (PASSWORD_POLICY.requireLowercase) parts.push('a lowercase letter')
  if (PASSWORD_POLICY.requireUppercase) parts.push('an uppercase letter')
  if (PASSWORD_POLICY.requireDigit) parts.push('a number')
  if (PASSWORD_POLICY.requireSpecial) parts.push('a symbol')
  return `Use ${parts.join(', ')}.`
}

export function validatePasswordForSignup(password: string): string | null {
  if (!password.trim()) return 'Please enter a password.'
  if (!isPasswordPolicyMet(password)) return passwordPolicySubmitMessage()
  return null
}

function randomInt(max: number) {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const buf = new Uint32Array(1)
    crypto.getRandomValues(buf)
    return buf[0]! % max
  }
  return Math.floor(Math.random() * max)
}

/** Memorable passphrase-style password that satisfies PASSWORD_POLICY */
export function generateSecurePassword(): string {
  const w1 = WORD_A[randomInt(WORD_A.length)]!
  const w2 = WORD_B[randomInt(WORD_B.length)]!
  const num = 10 + randomInt(89)
  return `${w1}${w2}!${num}`
}
