import { useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import AuthForm, { FormField, inputClass, inputErrorClass } from '../components/AuthForm'
import { requestPasswordReset } from '../lib/auth'
import { formatError } from '../lib/errors'
import { isSupabaseConfigured } from '../lib/supabase'
import { isValidEmail } from '../lib/validation'

const RESEND_COOLDOWN_MS = 60_000

export default function ForgotPassword() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<string | undefined>()
  const [sent, setSent] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')
  const lastSentAtRef = useRef(0)

  async function submitEmail(email: string) {
    const now = Date.now()
    if (now - lastSentAtRef.current < RESEND_COOLDOWN_MS) {
      setError(t('auth.resetRateLimited'))
      return
    }

    setLoading(true)
    setError(null)
    setFieldError(undefined)

    try {
      await requestPasswordReset(email)
      lastSentAtRef.current = Date.now()
      setSubmittedEmail(email)
      setSent(true)
    } catch (err) {
      setError(formatError(err) || t('auth.resetSendFailed'))
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!isSupabaseConfigured) {
      setError('Supabase is not configured. Check your .env file.')
      return
    }

    const email = String(new FormData(e.currentTarget).get('email') ?? '').trim()
    if (!email) {
      setFieldError(t('auth.emailRequired'))
      return
    }
    if (!isValidEmail(email)) {
      setFieldError(t('auth.emailInvalid'))
      return
    }

    await submitEmail(email)
  }

  if (sent) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-12rem)] max-w-md flex-col justify-center px-4 py-12">
        <div className="card-surface p-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-50 text-accent-700">
            <Mail className="h-7 w-7" aria-hidden />
          </span>
          <h1 className="mt-5 text-2xl font-bold text-primary">{t('auth.resetEmailSentTitle')}</h1>
          <p className="mt-3 text-sm leading-relaxed text-secondary">
            {t('auth.resetEmailSentMessage')}
          </p>
          {submittedEmail && (
            <p className="mt-2 text-sm font-medium text-primary">{submittedEmail}</p>
          )}
          {error && (
            <p
              className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              {error}
            </p>
          )}
          <div className="mt-8 flex flex-col gap-3">
            <Link to="/login" className="btn-primary w-full text-center">
              {t('auth.backToLogin')}
            </Link>
            <button
              type="button"
              disabled={loading}
              onClick={() => void submitEmail(submittedEmail)}
              className="btn-secondary w-full"
            >
              {loading ? t('auth.pleaseWait') : t('auth.resendResetLink')}
            </button>
          </div>
        </div>
        <p className="mt-6 text-center">
          <Link to="/" className="auth-link">
            {t('auth.backHome')}
          </Link>
        </p>
      </main>
    )
  }

  return (
    <AuthForm
      title={t('auth.forgotTitle')}
      subtitle={t('auth.forgotSubtitle')}
      submitLabel={t('auth.sendResetLink')}
      loading={loading}
      error={error}
      onSubmit={handleSubmit}
      footer={
        <>
          <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
            {t('auth.backToLogin')}
          </Link>
        </>
      }
    >
      <FormField label={t('auth.email')} id="email" error={fieldError}>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          aria-invalid={Boolean(fieldError)}
          className={`${inputClass} ${fieldError ? inputErrorClass : ''}`}
          placeholder="you@example.com"
        />
      </FormField>
    </AuthForm>
  )
}
