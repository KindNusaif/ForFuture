import { useCallback, useId, useState } from 'react'
import { Check, Circle, Copy, RefreshCw, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  generateSecurePassword,
  getPasswordRuleStatuses,
  getPasswordStrengthTier,
  isPasswordPolicyMet,
  PASSWORD_POLICY,
  type PasswordStrengthTier,
} from '../../lib/passwordPolicy'

interface AuthPasswordHelperProps {
  id?: string
  password: string
  onUseSuggested?: (value: string) => void
  showSuggest?: boolean
}

const TIER_LABEL: Record<Exclude<PasswordStrengthTier, 'empty'>, { key: string; defaultValue: string }> =
  {
    weak: { key: 'auth.strengthWeak', defaultValue: 'Weak' },
    fair: { key: 'auth.strengthFair', defaultValue: 'Fair' },
    strong: { key: 'auth.strengthStrong', defaultValue: 'Strong' },
  }

export default function AuthPasswordHelper({
  id,
  password,
  onUseSuggested,
  showSuggest = true,
}: AuthPasswordHelperProps) {
  const { t } = useTranslation()
  const listId = useId()
  const [suggested, setSuggested] = useState<string | null>(null)
  const [copyDone, setCopyDone] = useState(false)

  const tier = getPasswordStrengthTier(password)
  const rules = getPasswordRuleStatuses(password)
  const policyMet = isPasswordPolicyMet(password)

  const regenerate = useCallback(() => {
    setSuggested(generateSecurePassword())
    setCopyDone(false)
  }, [])

  function handleSuggest() {
    regenerate()
  }

  async function handleCopy() {
    if (!suggested) return
    try {
      await navigator.clipboard.writeText(suggested)
      setCopyDone(true)
      window.setTimeout(() => setCopyDone(false), 2000)
    } catch {
      setCopyDone(false)
    }
  }

  function handleUseSuggested() {
    if (!suggested || !onUseSuggested) return
    onUseSuggested(suggested)
    setSuggested(null)
    setCopyDone(false)
  }

  return (
    <div id={id} className="auth-password-helper" aria-live="polite">
      {password.length > 0 && (
        <div className="auth-password-helper-head">
          <p className="auth-password-strength-label">
            {t('auth.passwordStrengthLabel', { defaultValue: 'Password strength' })}:{' '}
            <span className={`auth-password-strength-value auth-password-strength-value--${tier}`}>
              {tier === 'empty'
                ? '—'
                : t(TIER_LABEL[tier].key, { defaultValue: TIER_LABEL[tier].defaultValue })}
            </span>
          </p>
          <div className="auth-password-strength-bars" aria-hidden>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`auth-password-strength-bar ${
                  (tier === 'weak' && i === 0) ||
                  (tier === 'fair' && i <= 1) ||
                  (tier === 'strong' && i <= 2)
                    ? `auth-password-strength-bar--filled auth-password-strength-bar--${tier}`
                    : ''
                }`}
              />
            ))}
          </div>
        </div>
      )}

      <p className="auth-password-helper-hint">
        {t('auth.passwordHelperHint', {
          defaultValue: `Use at least ${PASSWORD_POLICY.minLength} characters with mixed letters and numbers.`,
        })}
      </p>

      <ul id={listId} className="auth-password-checklist">
        {rules.map((rule) => (
          <li
            key={rule.id}
            className={`auth-password-checklist-item ${
              rule.met ? 'auth-password-checklist-item--met' : ''
            } ${!rule.required ? 'auth-password-checklist-item--optional' : ''}`}
          >
            {rule.met ? (
              <Check className="auth-password-checklist-icon" aria-hidden />
            ) : (
              <Circle className="auth-password-checklist-icon" aria-hidden />
            )}
            <span>{t(rule.labelKey, { defaultValue: rule.labelDefault })}</span>
          </li>
        ))}
      </ul>

      {showSuggest && onUseSuggested && (
        <div className="auth-password-suggest">
          <button type="button" className="auth-password-suggest-trigger" onClick={handleSuggest}>
            <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
            {t('auth.suggestPassword', { defaultValue: 'Suggest a secure password' })}
          </button>

          {suggested && (
            <div className="auth-password-suggest-panel">
              <p className="auth-password-suggest-value" aria-live="polite">
                {suggested}
              </p>
              <p className="auth-password-suggest-note">
                {t('auth.suggestPasswordNote', {
                  defaultValue: 'Save this password in your password manager.',
                })}
              </p>
              <div className="auth-password-suggest-actions">
                <button type="button" className="auth-password-suggest-btn" onClick={regenerate}>
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                  {t('auth.regeneratePassword', { defaultValue: 'Regenerate' })}
                </button>
                <button type="button" className="auth-password-suggest-btn" onClick={() => void handleCopy()}>
                  <Copy className="h-3.5 w-3.5" aria-hidden />
                  {copyDone
                    ? t('auth.copiedPassword', { defaultValue: 'Copied' })
                    : t('auth.copyPassword', { defaultValue: 'Copy' })}
                </button>
                <button
                  type="button"
                  className="auth-password-suggest-btn auth-password-suggest-btn--primary"
                  onClick={handleUseSuggested}
                >
                  {t('auth.useSuggestedPassword', { defaultValue: 'Use this password' })}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {password.length > 0 && !policyMet && (
        <p className="auth-password-inline-hint" role="status">
          {t('auth.passwordNotReady', {
            defaultValue: 'Complete the checklist above before creating your account.',
          })}
        </p>
      )}
    </div>
  )
}
