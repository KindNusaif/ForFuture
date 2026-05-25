import { useState, useId, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  AuthField,
  AuthPasswordInput,
  AuthSimpleShell,
} from '../components/auth/AuthPremium'
import AuthPasswordHelper from '../components/auth/AuthPasswordHelper'
import { usePasswordRecoverySession } from '../hooks/usePasswordRecoverySession'
import { signOut, updatePassword } from '../lib/auth'
import { mapAuthError } from '../lib/authUserMessages'
import { isSupabaseConfigured } from '../lib/supabase'
import { hasPasswordResetErrors, validatePasswordReset } from '../lib/validation'

export default function ResetPassword() {
  const { t } = useTranslation()
  const recoveryStatus = usePasswordRecoverySession()
  const reactId = useId()
  const passId = `${reactId}-pw`
  const confirmId = `${reactId}-confirm`

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirm?: string }>({})
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (loading) return
    if (!isSupabaseConfigured) {
      setError(t('auth.setupRequired'))
      return
    }

    const errors = validatePasswordReset(password, confirm)
    setFieldErrors(errors)
    if (hasPasswordResetErrors(errors)) {
      setError(errors.password ?? errors.confirm ?? null)
      return
    }

    setLoading(true)
    setError(null)
    try {
      await updatePassword(password)
      await signOut()
      setSuccess(true)
    } catch (err) {
      setError(mapAuthError(err, 'passwordReset', t) || t('auth.resetUpdateFailed'))
    } finally {
      setLoading(false)
    }
  }

  if (recoveryStatus === 'loading') {
    return (
      <div className="auth-premium-shell flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--auth-indigo)]" aria-hidden />
        <p className="text-sm text-[var(--auth-muted)]">{t('auth.resetVerifyingLink')}</p>
      </div>
    )
  }

  if (recoveryStatus === 'invalid') {
    return (
      <AuthSimpleShell
        title={t('auth.resetInvalidTitle')}
        subtitle={t('auth.resetInvalidMessage')}
      >
        <div className="flex flex-col gap-3">
          <Link to="/forgot-password" className="auth-premium-submit text-center no-underline">
            {t('auth.requestNewResetLink')}
          </Link>
          <Link to="/login" className="auth-premium-forgot-link text-center">
            {t('auth.backToLogin')}
          </Link>
        </div>
      </AuthSimpleShell>
    )
  }

  if (success) {
    return (
      <AuthSimpleShell
        title={t('auth.resetSuccessTitle')}
        subtitle={t('auth.resetSuccessMessage')}
      >
        <div className="text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[color-mix(in_oklab,var(--auth-mint)_25%,white)] text-[var(--auth-indigo)]">
            <CheckCircle2 className="h-7 w-7" aria-hidden />
          </span>
          <Link
            to="/login"
            replace
            state={{ resetSuccess: true }}
            className="auth-premium-submit mt-8 inline-flex w-full justify-center no-underline"
          >
            {t('auth.goToLogin')}
          </Link>
        </div>
      </AuthSimpleShell>
    )
  }

  return (
    <AuthSimpleShell
      title={t('auth.resetTitle')}
      subtitle={t('auth.resetSubtitle')}
      error={error}
      footer={
        <Link to="/login" className="auth-premium-forgot-link">
          {t('auth.backToLogin')}
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="auth-premium-form-stack">
        <AuthField fieldId={passId} label={t('auth.newPassword')}>
          <AuthPasswordInput
            inputId={passId}
            value={password}
            onChange={setPassword}
            disabled={loading}
            autoComplete="new-password"
          />
        </AuthField>
        <AuthPasswordHelper password={password} onUseSuggested={setPassword} />
        {fieldErrors.password && (
          <p className="auth-premium-alert auth-premium-alert--error -mt-1 py-2 text-xs" role="alert">
            {fieldErrors.password}
          </p>
        )}
        <AuthField fieldId={confirmId} label={t('auth.confirmPassword')}>
          <AuthPasswordInput
            inputId={confirmId}
            value={confirm}
            onChange={setConfirm}
            disabled={loading}
            autoComplete="new-password"
          />
        </AuthField>
        {fieldErrors.confirm && (
          <p className="auth-premium-alert auth-premium-alert--error -mt-1 py-2 text-xs" role="alert">
            {fieldErrors.confirm}
          </p>
        )}
        <button type="submit" disabled={loading} className="auth-premium-submit">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('auth.updatePassword')}
        </button>
      </form>
    </AuthSimpleShell>
  )
}
