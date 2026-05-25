import { useRef, useState, useId, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Mail } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AuthField, AuthSimpleShell } from '../components/auth/AuthPremium'
import { requestPasswordReset } from '../lib/auth'
import { mapAuthError } from '../lib/authUserMessages'
import { isSupabaseConfigured } from '../lib/supabase'
import { isValidEmail } from '../lib/validation'

const RESEND_COOLDOWN_MS = 60_000

export default function ForgotPassword() {
  const { t } = useTranslation()
  const emailFieldId = useId()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')
  const lastSentAtRef = useRef(0)

  async function submitEmail(address: string) {
    if (loading) return
    const now = Date.now()
    if (now - lastSentAtRef.current < RESEND_COOLDOWN_MS) {
      setError(t('auth.resetRateLimited'))
      return
    }

    setLoading(true)
    setError(null)

    try {
      await requestPasswordReset(address)
      lastSentAtRef.current = Date.now()
      setSubmittedEmail(address)
      setSent(true)
    } catch (err) {
      setError(mapAuthError(err, 'passwordReset', t))
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (loading) return

    if (!isSupabaseConfigured) {
      setError(t('auth.setupRequired'))
      return
    }

    const trimmed = email.trim()
    if (!trimmed) {
      setError(t('auth.emailRequired'))
      return
    }
    if (!isValidEmail(trimmed)) {
      setError(t('auth.emailInvalid'))
      return
    }

    await submitEmail(trimmed)
  }

  if (sent) {
    return (
      <AuthSimpleShell
        title={t('auth.resetEmailSentTitle')}
        subtitle={t('auth.resetEmailSentMessage')}
        error={error}
      >
        <div className="text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[color-mix(in_oklab,var(--auth-mint)_25%,white)] text-[var(--auth-indigo)]">
            <Mail className="h-7 w-7" aria-hidden />
          </span>
          {submittedEmail && (
            <p className="mt-4 text-sm font-medium text-[var(--auth-ink)]">{submittedEmail}</p>
          )}
          <div className="mt-8 flex flex-col gap-3">
            <Link to="/login" className="auth-premium-submit text-center no-underline">
              {t('auth.backToLogin')}
            </Link>
            <button
              type="button"
              disabled={loading}
              onClick={() => void submitEmail(submittedEmail)}
              className="auth-premium-google"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading ? t('auth.pleaseWait') : t('auth.resendResetLink')}
            </button>
          </div>
          <p className="mt-6 text-center text-sm">
            <Link to="/" className="auth-premium-forgot-link">
              {t('auth.backHome')}
            </Link>
          </p>
        </div>
      </AuthSimpleShell>
    )
  }

  return (
    <AuthSimpleShell
      title={t('auth.forgotTitle')}
      subtitle={t('auth.forgotSubtitle')}
      error={error}
      footer={
        <Link to="/login" className="auth-premium-forgot-link">
          {t('auth.backToLogin')}
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="auth-premium-form-stack">
        <AuthField fieldId={emailFieldId} label={t('auth.emailAddress')} icon={<Mail className="h-4 w-4" />}>
          <input
            id={emailFieldId}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@domain.com"
            className="auth-field-input auth-field-input--icon"
            autoComplete="email"
            required
            disabled={loading}
          />
        </AuthField>
        <button type="submit" disabled={loading} className="auth-premium-submit">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('auth.sendResetLink')}
        </button>
      </form>
    </AuthSimpleShell>
  )
}
