import { useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AuthShell } from '../components/auth/AuthPremium'
import { resendSignupConfirmation, signIn, signInWithGoogle } from '../lib/auth'
import { isLoginUnconfirmedMessage, mapAuthError } from '../lib/authUserMessages'
import { isSupabaseConfigured } from '../lib/supabase'
import { isValidEmail } from '../lib/validation'
import { resolveAuthReturn } from '../lib/authReturn'
import { useToast } from '../hooks/useToast'

export default function Login() {
  const { t } = useTranslation()
  const location = useLocation()
  const toast = useToast()
  const from = resolveAuthReturn(location.state)
  const resetSuccess = (location.state as { resetSuccess?: boolean })?.resetSuccess

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSent, setResendSent] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (loading) return

    setError(null)

    if (!isSupabaseConfigured) {
      setError(t('auth.setupRequired'))
      return
    }

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setError(t('auth.emailRequired'))
      return
    }
    if (!isValidEmail(trimmedEmail)) {
      setError(t('auth.emailInvalid'))
      return
    }
    if (!password) {
      setError(t('auth.passwordRequired'))
      return
    }

    setLoading(true)
    const loadingGuard = window.setTimeout(() => setLoading(false), 20_000)
    try {
      await signIn(trimmedEmail, password)
      toast.success(t('auth.loginWelcome'))
      /* GuestRoute redirects once AuthContext receives SIGNED_IN — avoids racing ProtectedRoute. */
    } catch (err) {
      setError(mapAuthError(err, 'login'))
      setLoading(false)
    } finally {
      window.clearTimeout(loadingGuard)
    }
  }

  async function handleResendConfirmation() {
    const trimmed = email.trim()
    if (!trimmed || resendLoading) return
    setResendLoading(true)
    setResendSent(false)
    try {
      await resendSignupConfirmation(trimmed)
      setResendSent(true)
      setError(null)
    } catch (err) {
      setError(mapAuthError(err, 'signup'))
    } finally {
      setResendLoading(false)
    }
  }

  async function handleGoogle() {
    if (googleLoading || loading) return
    if (!isSupabaseConfigured) {
      setError(t('auth.setupRequired'))
      return
    }
    setError(null)
    setGoogleLoading(true)
    try {
      await signInWithGoogle(from)
    } catch (err) {
      setError(mapAuthError(err, 'oauth'))
      setGoogleLoading(false)
    }
  }

  const errorActions =
    error && isLoginUnconfirmedMessage(error) ? (
      <button
        type="button"
        className="auth-alert-action-link"
        disabled={resendLoading || !email.trim()}
        onClick={() => void handleResendConfirmation()}
      >
        {resendLoading
          ? t('auth.resendingConfirmation', { defaultValue: 'Sending…' })
          : t('auth.resendConfirmation', { defaultValue: 'Resend confirmation email' })}
      </button>
    ) : undefined

  return (
    <AuthShell
      mode="login"
      loading={loading}
      googleLoading={googleLoading}
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      onSubmit={handleSubmit}
      onGoogle={() => void handleGoogle()}
      error={error}
      errorActions={errorActions}
      banner={
        resendSent
          ? t('auth.confirmEmailSent', {
              defaultValue: 'Confirmation email sent. Check your inbox.',
            })
          : resetSuccess
            ? t('auth.resetSuccessLogin')
            : null
      }
      showExploreLink
      footer={
        <>
          {t('auth.noAccount')}{' '}
          <Link to="/signup" state={location.state}>
            {t('auth.signUpLink')}
          </Link>
        </>
      }
    />
  )
}
