import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AuthForm, { FormField, inputClass, inputErrorClass } from '../components/AuthForm'
import PasswordField from '../components/PasswordField'
import { signUp } from '../lib/auth'
import { formatError } from '../lib/errors'
import { isSupabaseConfigured } from '../lib/supabase'
import { isValidEmail, validateSignup } from '../lib/validation'

export default function Signup() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/feed'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string
    email?: string
    password?: string
  }>({})

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
    const name = String(form.get('name') ?? '').trim()
    const email = String(form.get('email') ?? '').trim()
    const password = String(form.get('password') ?? '')

    const errors: typeof fieldErrors = {}
    if (!name.trim() || name.trim().length < 2) {
      errors.name = t('auth.nameRequired')
    }
    if (!email) {
      errors.email = t('auth.emailRequired')
    } else if (!isValidEmail(email)) {
      errors.email = t('auth.emailInvalid')
    }
    if (!password) {
      errors.password = t('auth.passwordRequired')
    } else if (password.length < 6) {
      errors.password = t('auth.passwordTooShort')
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    const validationError = validateSignup(name, email, password)
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    try {
      await signUp(email, password, name)
      navigate(from, { replace: true })
    } catch (err) {
      setError(formatError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthForm
      title={t('auth.signupTitle')}
      subtitle={t('auth.signupSubtitle')}
      submitLabel={t('auth.signupButton')}
      loadingLabel={t('auth.pleaseWait')}
      loading={loading}
      error={error}
      onSubmit={handleSubmit}
      footer={
        <>
          {t('auth.hasAccount')}{' '}
          <Link
            to="/login"
            className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-300 dark:hover:text-brand-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
          >
            {t('auth.logInLink')}
          </Link>
        </>
      }
    >
      <FormField label={t('auth.displayName')} id="name" error={fieldErrors.name}>
        <input
          id="name"
          name="name"
          type="text"
          required
          autoComplete="name"
          disabled={loading}
          aria-invalid={Boolean(fieldErrors.name)}
          className={`${inputClass} ${fieldErrors.name ? inputErrorClass : ''}`}
          placeholder="Jordan Chen"
        />
      </FormField>
      <FormField label={t('auth.email')} id="email" error={fieldErrors.email}>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          disabled={loading}
          aria-invalid={Boolean(fieldErrors.email)}
          className={`${inputClass} ${fieldErrors.email ? inputErrorClass : ''}`}
          placeholder="you@example.com"
        />
      </FormField>
      <PasswordField
        id="password"
        name="password"
        label={t('auth.password')}
        error={fieldErrors.password}
        autoComplete="new-password"
        minLength={6}
        placeholder="At least 6 characters"
        disabled={loading}
        footer={<p className="form-hint mt-1.5">{t('auth.passwordHint')}</p>}
      />
    </AuthForm>
  )
}
