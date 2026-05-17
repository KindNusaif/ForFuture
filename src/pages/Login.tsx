import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import AuthForm, { FormField, inputClass, inputErrorClass } from '../components/AuthForm'
import PasswordField from '../components/PasswordField'
import { signIn } from '../lib/auth'
import { formatError } from '../lib/errors'
import { isSupabaseConfigured } from '../lib/supabase'
import { isValidEmail, validateLogin } from '../lib/validation'

export default function Login() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/feed'
  const resetSuccess = (location.state as { resetSuccess?: boolean })?.resetSuccess

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (loading) return

    setFieldErrors({})
    setError(null)

    if (!isSupabaseConfigured) {
      setError('Supabase is not configured. Check your .env file.')
      return
    }

    const form = new FormData(e.currentTarget)
    const email = String(form.get('email') ?? '').trim()
    const password = String(form.get('password') ?? '')

    const errors: { email?: string; password?: string } = {}
    if (!email) {
      errors.email = t('auth.emailRequired')
    } else if (!isValidEmail(email)) {
      errors.email = t('auth.emailInvalid')
    }
    if (!password) {
      errors.password = t('auth.passwordRequired')
    }

    if (errors.email || errors.password) {
      setFieldErrors(errors)
      return
    }

    const validationError = validateLogin(email, password)
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    try {
      await signIn(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(formatError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthForm
      title={t('auth.loginTitle')}
      subtitle={t('auth.loginSubtitle')}
      submitLabel={t('auth.loginButton')}
      loadingLabel={t('auth.signingIn')}
      loading={loading}
      onSubmit={handleSubmit}
      success={
        resetSuccess ? t('auth.resetSuccessLogin') : null
      }
      error={error}
      footer={
        <>
          {t('auth.noAccount')}{' '}
          <Link
            to="/signup"
            state={location.state}
            className="font-semibold text-brand-600 hover:text-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
          >
            {t('auth.signUpLink')}
          </Link>
        </>
      }
      belowFooter={
        <div className="mt-8 space-y-4">
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-slate-200" aria-hidden />
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
              {t('auth.orDivider')}
            </span>
            <span className="h-px flex-1 bg-slate-200" aria-hidden />
          </div>
          <Link
            to="/movements"
            className="btn-secondary flex w-full items-center justify-center gap-2 min-h-[44px]!"
          >
            <Compass className="h-4 w-4 text-accent-600" aria-hidden />
            {t('landing.exploreCta')}
          </Link>
          <p className="text-center text-xs leading-relaxed text-slate-500">
            {t('auth.loginTrustNote')}
          </p>
        </div>
      }
    >
      <FormField label={t('auth.email')} id="email" error={fieldErrors.email}>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          aria-invalid={Boolean(fieldErrors.email)}
          className={`${inputClass} ${fieldErrors.email ? inputErrorClass : ''}`}
          placeholder="you@example.com"
          disabled={loading}
        />
      </FormField>

      <PasswordField
        id="password"
        name="password"
        label={t('auth.password')}
        error={fieldErrors.password}
        autoComplete="current-password"
        disabled={loading}
        footer={
          <p className="mt-2 text-right">
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-brand-600 hover:text-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
            >
              {t('auth.forgotPassword')}
            </Link>
          </p>
        }
      />
    </AuthForm>
  )
}
