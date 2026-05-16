import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AuthForm, { FormField, inputClass, inputErrorClass } from '../components/AuthForm'
import { signIn } from '../lib/auth'
import { formatError } from '../lib/errors'
import { isSupabaseConfigured } from '../lib/supabase'
import { validateLogin } from '../lib/validation'

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
    setFieldErrors({})

    if (!isSupabaseConfigured) {
      setError('Supabase is not configured. Check your .env file.')
      return
    }

    const form = new FormData(e.currentTarget)
    const email = String(form.get('email') ?? '').trim()
    const password = String(form.get('password') ?? '')

    const validationError = validateLogin(email, password)
    if (validationError) {
      if (!email.trim()) setFieldErrors({ email: 'Email is required.' })
      else if (!password) setFieldErrors({ password: 'Password is required.' })
      else setError(validationError)
      return
    }

    setLoading(true)
    setError(null)
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
      loading={loading}
      onSubmit={handleSubmit}
      success={
        resetSuccess ? 'Your password was updated. Sign in with your new password.' : null
      }
      error={error}
      footer={
        <>
          {t('auth.noAccount')}{' '}
          <Link to="/signup" className="font-semibold text-brand-600 hover:text-brand-700">
            {t('auth.signUpLink')}
          </Link>
        </>
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
        />
      </FormField>
      <FormField label={t('auth.password')} id="password" error={fieldErrors.password}>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          aria-invalid={Boolean(fieldErrors.password)}
          className={`${inputClass} ${fieldErrors.password ? inputErrorClass : ''}`}
          placeholder="••••••••"
        />
        <p className="mt-2 text-right">
          <Link
            to="/forgot-password"
            className="text-sm font-medium text-brand-600 hover:text-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
          >
            {t('auth.forgotPassword')}
          </Link>
        </p>
      </FormField>
    </AuthForm>
  )
}
