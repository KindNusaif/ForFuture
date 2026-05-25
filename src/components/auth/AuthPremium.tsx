import { Link } from 'react-router-dom'
import { useId, useState, type ReactNode } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Sparkles,
  User as UserIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import AuthFormAlert from './AuthFormAlert'
import SignupConfirmationPanel from './SignupConfirmationPanel'
import AuthPasswordHelper from './AuthPasswordHelper'
import { isPasswordPolicyMet, PASSWORD_POLICY } from '../../lib/passwordPolicy'
import { isValidEmail } from '../../lib/validation'

export function AuthBackToHome() {
  const { t } = useTranslation()

  return (
    <Link to="/" className="auth-premium-back-home">
      <ArrowLeft className="auth-premium-back-home-icon" aria-hidden />
      {t('auth.backToForFuture', { defaultValue: 'Back to ForFuture' })}
    </Link>
  )
}

export function AuthBrandPanel({ showSocialProof = false }: { showSocialProof?: boolean }) {
  const { t } = useTranslation()

  return (
    <aside className="auth-premium-brand">
      <div className="auth-premium-brand-glow-a" aria-hidden />
      <div className="auth-premium-brand-glow-b" aria-hidden />
      <Link
        to="/"
        className="auth-premium-brand-logo"
        aria-label={t('auth.backToHomeAria', { defaultValue: 'ForFuture home' })}
      >
        <span className="auth-premium-brand-icon">
          <Sparkles className="h-5 w-5" aria-hidden />
        </span>
        <span>
          <div className="text-lg font-medium tracking-tight">ForFuture</div>
          <div className="auth-premium-brand-tagline">
            {t('auth.brandTagline', {
              defaultValue: 'Youth civic action, made visible.',
            })}
          </div>
        </span>
      </Link>
      <div className="auth-premium-brand-copy">
        <div className="auth-premium-brand-headline-glow" aria-hidden />
        <h1 className="auth-premium-brand-headline">
          <span className="auth-premium-brand-headline-text">
            {t('auth.brandHeadlineBefore')}
          </span>{' '}
          <em>{t('auth.brandHeadlineAccent')}</em>{' '}
          <span className="auth-premium-brand-headline-text">
            {t('auth.brandHeadlineAfter')}
          </span>
        </h1>
        <p className="auth-premium-brand-desc">{t('auth.brandDescription')}</p>
        <p className="auth-premium-brand-microline">{t('auth.brandMicroline')}</p>
        {showSocialProof && (
          <div className="auth-premium-brand-social">
            <div className="auth-premium-brand-avatars" aria-hidden>
              <span className="auth-premium-brand-avatar auth-premium-brand-avatar--a" />
              <span className="auth-premium-brand-avatar auth-premium-brand-avatar--b" />
              <span className="auth-premium-brand-avatar auth-premium-brand-avatar--c" />
            </div>
            <p className="auth-premium-brand-social-text auth-premium-brand-social-text--tagline">
              {t('auth.brandSocialProof')}
            </p>
          </div>
        )}
      </div>
      <div className="auth-premium-brand-footer">
        <span>{t('auth.brandCopyright', { year: new Date().getFullYear() })}</span>
      </div>
    </aside>
  )
}

export function AuthPremiumLayout({
  children,
  showSignupSocialProof = false,
}: {
  children: ReactNode
  showSignupSocialProof?: boolean
}) {
  return (
    <div className="auth-premium-shell">
      <AuthBackToHome />
      <div className="auth-premium-card">
        <AuthBrandPanel showSocialProof={showSignupSocialProof} />
        <section className="auth-premium-form-wrap">{children}</section>
      </div>
    </div>
  )
}

export function AuthMobileLogo() {
  const { t } = useTranslation()

  return (
    <Link
      to="/"
      className="auth-premium-mobile-logo"
      aria-label={t('auth.backToHomeAria')}
    >
      <span className="auth-premium-brand-icon" style={{ width: '2.25rem', height: '2.25rem', borderRadius: '9999px' }}>
        <Sparkles className="h-4 w-4" aria-hidden />
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="auth-premium-title" style={{ marginBottom: 0, fontSize: '1.125rem' }}>
          ForFuture
        </span>
        <span className="auth-premium-mobile-tagline">{t('auth.brandTagline')}</span>
      </span>
    </Link>
  )
}

export function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.28-4.74 3.28-8.07z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.75c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.12c-.22-.66-.35-1.36-.35-2.12s.13-1.46.35-2.12V7.04H2.18C1.43 8.52 1 10.21 1 12s.43 3.48 1.18 4.96l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.04l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  )
}

export function AuthField({
  fieldId,
  label,
  children,
  icon,
  hint,
}: {
  fieldId: string
  label: string
  children: ReactNode
  icon?: ReactNode
  hint?: ReactNode
}) {
  return (
    <div className="auth-field-block">
      {hint ? (
        <div className="auth-field-row">
          <label htmlFor={fieldId} className="auth-field-label">
            {label}
          </label>
          {hint}
        </div>
      ) : (
        <label htmlFor={fieldId} className="auth-field-label block">
          {label}
        </label>
      )}
      <div className="auth-field-wrap">
        {icon && <span className="auth-field-icon">{icon}</span>}
        {children}
      </div>
    </div>
  )
}

export function AuthPasswordInput({
  inputId,
  value,
  onChange,
  disabled,
  autoComplete,
  invalid,
  minLength,
  ariaDescribedBy,
}: {
  inputId: string
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  autoComplete?: string
  invalid?: boolean
  minLength?: number
  ariaDescribedBy?: string
}) {
  const { t } = useTranslation()
  const [show, setShow] = useState(false)

  return (
    <div className="auth-field-wrap">
      <span className="auth-field-icon">
        <Lock className="h-4 w-4" aria-hidden />
      </span>
      <input
        id={inputId}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="••••••••"
        className={`auth-field-input auth-field-input--icon auth-field-input--password${
          invalid ? ' auth-field-input--invalid' : ''
        }`}
        required
        minLength={minLength}
        disabled={disabled}
        autoComplete={autoComplete}
        aria-invalid={invalid || undefined}
        aria-describedby={ariaDescribedBy}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="auth-field-toggle"
        aria-label={show ? t('auth.hidePassword') : t('auth.showPassword')}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}

export interface AuthShellProps {
  mode: 'login' | 'signup'
  loading: boolean
  googleLoading?: boolean
  email: string
  setEmail: (v: string) => void
  password: string
  setPassword: (v: string) => void
  displayName?: string
  setDisplayName?: (v: string) => void
  onSubmit: (e: React.FormEvent) => void
  onGoogle: () => void
  error?: string | null
  errorActions?: ReactNode
  success?: string | null
  banner?: string | null
  pendingConfirmation?: {
    email: string
    onResend: () => void
    resendLoading: boolean
    resendDisabled: boolean
    resendSent: boolean
  }
  footer: ReactNode
  authLinkState?: unknown
  showExploreLink?: boolean
}

export function AuthShell({
  mode,
  loading,
  googleLoading = false,
  email,
  setEmail,
  password,
  setPassword,
  displayName = '',
  setDisplayName,
  onSubmit,
  onGoogle,
  error,
  errorActions,
  success,
  banner,
  pendingConfirmation,
  footer,
  showExploreLink = false,
  authLinkState,
}: AuthShellProps) {
  const { t } = useTranslation()
  const isLogin = mode === 'login'
  const busy = loading || googleLoading
  const formLocked = Boolean(success) || Boolean(pendingConfirmation)
  const reactId = useId()
  const nameId = `${reactId}-name`
  const emailId = `${reactId}-email`
  const passwordId = `${reactId}-password`
  const formErrorId = `${reactId}-form-error`
  const passwordHelperId = `${reactId}-password-helper`
  const [termsAccepted, setTermsAccepted] = useState(false)

  const trimmedName = displayName.trim()
  const trimmedEmail = email.trim()
  const passwordPolicyOk = isPasswordPolicyMet(password)

  const signupCanSubmit =
    trimmedName.length >= 2 &&
    trimmedEmail.length > 0 &&
    isValidEmail(trimmedEmail) &&
    passwordPolicyOk &&
    termsAccepted

  const loginCanSubmit = trimmedEmail.length > 0 && password.length > 0
  const canSubmit = isLogin ? loginCanSubmit : signupCanSubmit
  const showPasswordInvalid = !isLogin && password.length > 0 && !passwordPolicyOk

  return (
    <AuthPremiumLayout showSignupSocialProof={!isLogin}>
      <div
        className={`auth-premium-form-inner${!isLogin ? ' auth-premium-form-inner--signup' : ''}`}
      >
        <AuthMobileLogo />
        <header className="auth-premium-form-header">
          <h2 className="auth-premium-title">
            {isLogin ? t('auth.loginTitle') : t('auth.signupTitle')}
          </h2>
          <p className="auth-premium-subtitle">
            {isLogin ? t('auth.loginSubtitlePremium') : t('auth.signupSubtitlePremium')}
          </p>
        </header>

        <div
          className={`auth-premium-message-slot${banner || error || success ? ' auth-premium-message-slot--active' : ''}`}
          aria-live="polite"
        >
          {banner && <AuthFormAlert variant="success">{banner}</AuthFormAlert>}
          {error && (
            <AuthFormAlert variant="error" id={formErrorId} actions={errorActions}>
              {error}
            </AuthFormAlert>
          )}
          {success && <AuthFormAlert variant="success">{success}</AuthFormAlert>}
        </div>

        {pendingConfirmation ? (
          <SignupConfirmationPanel
            email={pendingConfirmation.email}
            onResend={pendingConfirmation.onResend}
            resendLoading={pendingConfirmation.resendLoading}
            resendDisabled={pendingConfirmation.resendDisabled}
            resendSent={pendingConfirmation.resendSent}
            authLinkState={authLinkState}
          />
        ) : (
          <div className="auth-premium-form-body">
        <button
          type="button"
          onClick={onGoogle}
          disabled={busy || formLocked}
          className="auth-premium-google"
          aria-busy={googleLoading}
        >
          {googleLoading ? (
            <>
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
              <span>{t('auth.redirectingGoogle')}</span>
            </>
          ) : (
            <>
              <GoogleIcon />
              <span>{t('auth.continueWithGoogle')}</span>
            </>
          )}
        </button>

        <div className="auth-premium-divider" role="separator" aria-label={t('auth.orContinueEmail')}>
          <div className="auth-premium-divider-line" aria-hidden />
          <span className="auth-premium-divider-label">{t('auth.orContinueEmail')}</span>
          <div className="auth-premium-divider-line" aria-hidden />
        </div>

        <form
          onSubmit={onSubmit}
          className="auth-premium-form-stack"
          aria-disabled={formLocked}
          noValidate
          aria-describedby={error ? formErrorId : undefined}
        >
          {!isLogin && setDisplayName && (
            <AuthField fieldId={nameId} label={t('auth.displayName')} icon={<UserIcon className="h-4 w-4" />}>
              <input
                id={nameId}
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t('auth.displayNamePlaceholder')}
                className="auth-field-input auth-field-input--icon"
                autoComplete="name"
                required
                disabled={loading || formLocked}
              />
            </AuthField>
          )}
          <AuthField fieldId={emailId} label={t('auth.emailAddress')} icon={<Mail className="h-4 w-4" />}>
            <input
              id={emailId}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@domain.com"
              className="auth-field-input auth-field-input--icon"
              autoComplete="email"
              required
              disabled={loading || formLocked}
            />
          </AuthField>
          <AuthField
            fieldId={passwordId}
            label={t('auth.password')}
            hint={
              isLogin ? (
                <Link to="/forgot-password" className="auth-premium-forgot-link">
                  {t('auth.forgotPasswordShort')}
                </Link>
              ) : undefined
            }
          >
            <AuthPasswordInput
              inputId={passwordId}
              value={password}
              onChange={setPassword}
              disabled={loading || formLocked}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              invalid={showPasswordInvalid}
              minLength={isLogin ? undefined : PASSWORD_POLICY.minLength}
              ariaDescribedBy={!isLogin ? passwordHelperId : undefined}
            />
          </AuthField>
          {!isLogin && (
            <AuthPasswordHelper
              id={passwordHelperId}
              password={password}
              onUseSuggested={setPassword}
              showSuggest
            />
          )}
          {!isLogin && (
            <label className="auth-terms-label">
              <input
                type="checkbox"
                required
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                disabled={loading || formLocked}
                className="auth-terms-checkbox"
              />
              <span>
                {t('auth.termsAgree')}{' '}
                <Link to="/terms" className="auth-terms-link">
                  {t('auth.termsLink')}
                </Link>{' '}
                {t('auth.termsAnd')}{' '}
                <Link to="/privacy" className="auth-terms-link">
                  {t('auth.privacyLink')}
                </Link>
                .
              </span>
            </label>
          )}
          <button
            type="submit"
            disabled={loading || formLocked || !canSubmit}
            className="auth-premium-submit"
            aria-busy={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                <span>{isLogin ? t('auth.signingIn') : t('auth.creatingAccount')}</span>
              </>
            ) : (
              <>
                {isLogin ? t('auth.loginButton') : t('auth.signupButton')}
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
              </>
            )}
          </button>
          {!isLogin && <p className="auth-signup-purpose">{t('auth.signupTrustLine')}</p>}
        </form>
          </div>
        )}

        {showExploreLink && isLogin && (
          <Link to="/explore" className="auth-premium-explore" data-track="guest-explore-entry">
            {t('landing.exploreCta')}
          </Link>
        )}

        <footer className="auth-premium-footer">{footer}</footer>
      </div>
    </AuthPremiumLayout>
  )
}

export function AuthSimpleShell({
  title,
  subtitle,
  children,
  footer,
  error,
  success,
}: {
  title: string
  subtitle: string
  children: ReactNode
  footer?: ReactNode
  error?: string | null
  success?: string | null
}) {
  return (
    <AuthPremiumLayout>
      <div className="auth-premium-form-inner">
        <AuthMobileLogo />
        <header>
          <h2 className="auth-premium-title">{title}</h2>
          <p className="auth-premium-subtitle">{subtitle}</p>
        </header>
        {error && (
          <div className="mt-6">
            <AuthFormAlert variant="error">{error}</AuthFormAlert>
          </div>
        )}
        {success && (
          <div className="mt-6">
            <AuthFormAlert variant="success">{success}</AuthFormAlert>
          </div>
        )}
        <div className="mt-8">{children}</div>
        {footer && <footer className="auth-premium-footer">{footer}</footer>}
      </div>
    </AuthPremiumLayout>
  )
}
