import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import AuthForm from '../components/AuthForm'
import PasswordField from '../components/PasswordField'
import Logo from '../components/Logo'
import { usePasswordRecoverySession } from '../hooks/usePasswordRecoverySession'
import { signOut, updatePassword } from '../lib/auth'
import { formatError } from '../lib/errors'
import { isSupabaseConfigured } from '../lib/supabase'
import {
  hasPasswordResetErrors,
  PASSWORD_MIN_LENGTH,
  validatePasswordReset,
} from '../lib/validation'

export default function ResetPassword() {
  const { t } = useTranslation()
  const recoveryStatus = usePasswordRecoverySession()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirm?: string }>({})
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured. Check your .env file.')
      return
    }

    const form = new FormData(e.currentTarget)
    const password = String(form.get('password') ?? '')
    const confirm = String(form.get('confirm') ?? '')

    const errors = validatePasswordReset(password, confirm)
    setFieldErrors(errors)
    if (hasPasswordResetErrors(errors)) return

    setLoading(true)
    setError(null)
    try {
      await updatePassword(password)
      await signOut()
      setSuccess(true)
    } catch (err) {
      setError(formatError(err) || t('auth.resetUpdateFailed'))
    } finally {
      setLoading(false)
    }
  }

  if (recoveryStatus === 'loading') {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-12rem)] max-w-md flex-col items-center justify-center px-4 py-12">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" aria-hidden />
        <p className="mt-4 text-sm text-slate-600">{t('auth.resetVerifyingLink')}</p>
      </main>
    )
  }

  if (recoveryStatus === 'invalid') {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-12rem)] max-w-md flex-col justify-center px-4 py-12">
        <div className="mb-8 flex justify-center">
          <Logo to="/" />
        </div>
        <div className="card-surface p-8 text-center">
          <h1 className="text-xl font-bold text-slate-900">{t('auth.resetInvalidTitle')}</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            {t('auth.resetInvalidMessage')}
          </p>
          <Link to="/forgot-password" className="btn-primary mt-6 inline-flex w-full justify-center">
            {t('auth.requestNewResetLink')}
          </Link>
          <Link
            to="/login"
            className="mt-3 block text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            {t('auth.backToLogin')}
          </Link>
        </div>
      </main>
    )
  }

  if (success) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-12rem)] max-w-md flex-col justify-center px-4 py-12">
        <div className="card-surface p-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <CheckCircle2 className="h-7 w-7" aria-hidden />
          </span>
          <h1 className="mt-5 text-2xl font-bold text-slate-900">{t('auth.resetSuccessTitle')}</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            {t('auth.resetSuccessMessage')}
          </p>
          <Link
            to="/login"
            replace
            state={{ resetSuccess: true }}
            className="btn-primary mt-8 inline-flex w-full justify-center"
          >
            {t('auth.goToLogin')}
          </Link>
        </div>
      </main>
    )
  }

  return (
    <AuthForm
      title={t('auth.resetTitle')}
      subtitle={t('auth.resetSubtitle')}
      submitLabel={t('auth.updatePassword')}
      loading={loading}
      error={error}
      onSubmit={handleSubmit}
      footer={
        <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
          {t('auth.backToLogin')}
        </Link>
      }
    >
      <PasswordField
        id="password"
        name="password"
        label={t('auth.newPassword')}
        error={fieldErrors.password}
        autoComplete="new-password"
        placeholder={t('auth.passwordMinHint', { count: PASSWORD_MIN_LENGTH })}
        minLength={PASSWORD_MIN_LENGTH}
      />
      <PasswordField
        id="confirm"
        name="confirm"
        label={t('auth.confirmPassword')}
        error={fieldErrors.confirm}
        autoComplete="new-password"
        minLength={PASSWORD_MIN_LENGTH}
      />
    </AuthForm>
  )
}
