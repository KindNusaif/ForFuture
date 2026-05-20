import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AuthShell } from '../components/auth/AuthPremium'
import { resendSignupConfirmation, signUp, signInWithGoogle } from '../lib/auth'
import {
  isSignupExistingEmailMessage,
  isSignupProfileSetupMessage,
  mapAuthError,
} from '../lib/authUserMessages'
import { isSupabaseConfigured } from '../lib/supabase'
import { mapSignupValidationMessage } from '../lib/mapSignupValidation'
import { validateSignup } from '../lib/validation'
import { resolveAuthReturn } from '../lib/authReturn'

const RESEND_COOLDOWN_MS = 60_000

export default function Signup() {
  const { t } = useTranslation()
  const location = useLocation()
  const from = resolveAuthReturn(location.state)

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSent, setResendSent] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(false)
  const resendCooldownTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const previous = document.title
    document.title = `${t('auth.signupTitle')} — ForFuture`
    return () => {
      document.title = previous
      if (resendCooldownTimer.current) clearTimeout(resendCooldownTimer.current)
    }
  }, [t])

  function startResendCooldown() {
    setResendCooldown(true)
    if (resendCooldownTimer.current) clearTimeout(resendCooldownTimer.current)
    resendCooldownTimer.current = setTimeout(() => {
      setResendCooldown(false)
      resendCooldownTimer.current = null
    }, RESEND_COOLDOWN_MS)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (loading || pendingEmail) return

    setError(null)
    setSuccess(null)
    setResendSent(false)

    if (!isSupabaseConfigured) {
      setError(t('auth.setupRequired'))
      return
    }

    const name = displayName.trim()
    const trimmedEmail = email.trim()

    const validationError = validateSignup(name, trimmedEmail, password)
    if (validationError) {
      setError(mapSignupValidationMessage(validationError, t))
      return
    }

    setLoading(true)
    try {
      const result = await signUp(trimmedEmail, password, name)

      if (result.needsEmailConfirmation) {
        setPendingEmail(trimmedEmail)
        setLoading(false)
        return
      }

      setSuccess(t('auth.signupSuccess'))
      setLoading(false)
      /* GuestRoute redirects when AuthContext receives the new session. */
    } catch (err) {
      setError(mapAuthError(err, 'signup'))
      setLoading(false)
    }
  }

  async function handleResendConfirmation() {
    if (!pendingEmail || resendLoading || resendCooldown) return
    if (!isSupabaseConfigured) {
      setError(t('auth.setupRequired'))
      return
    }

    setResendLoading(true)
    setError(null)
    try {
      await resendSignupConfirmation(pendingEmail)
      setResendSent(true)
      startResendCooldown()
    } catch (err) {
      setError(mapAuthError(err, 'signup'))
    } finally {
      setResendLoading(false)
    }
  }

  async function handleGoogle() {
    if (googleLoading || loading || pendingEmail) return
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
    error && isSignupExistingEmailMessage(error) ? (
      <>
        <Link to="/login" state={location.state} className="auth-alert-action-link">
          {t('auth.goToLogin')}
        </Link>
        <Link to="/forgot-password" className="auth-alert-action-link auth-alert-action-link--muted">
          {t('auth.forgotPassword')}
        </Link>
      </>
    ) : error && isSignupProfileSetupMessage(error) ? (
      <Link to="/login" state={location.state} className="auth-alert-action-link">
        {t('auth.goToLogin')}
      </Link>
    ) : undefined

  return (
    <AuthShell
      mode="signup"
      loading={loading}
      googleLoading={googleLoading}
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      displayName={displayName}
      setDisplayName={setDisplayName}
      onSubmit={handleSubmit}
      onGoogle={() => void handleGoogle()}
      error={error}
      errorActions={errorActions}
      success={success}
      authLinkState={location.state}
      pendingConfirmation={
        pendingEmail
          ? {
              email: pendingEmail,
              onResend: () => void handleResendConfirmation(),
              resendLoading,
              resendDisabled: resendCooldown,
              resendSent,
            }
          : undefined
      }
      footer={
        pendingEmail ? null : (
          <>
            {t('auth.hasAccount')}{' '}
            <Link to="/login" state={location.state}>
              {t('auth.logInLink')}
            </Link>
          </>
        )
      }
    />
  )
}
