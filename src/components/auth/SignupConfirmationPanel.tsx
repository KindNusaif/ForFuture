import { Link } from 'react-router-dom'
import { Loader2, Mail } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface SignupConfirmationPanelProps {
  email: string
  onResend: () => void
  resendLoading: boolean
  resendDisabled: boolean
  resendSent: boolean
  authLinkState?: unknown
}

export default function SignupConfirmationPanel({
  email,
  onResend,
  resendLoading,
  resendDisabled,
  resendSent,
  authLinkState,
}: SignupConfirmationPanelProps) {
  const { t } = useTranslation()

  return (
    <section
      className="auth-signup-confirm"
      aria-labelledby="signup-confirm-title"
    >
      <span className="auth-signup-confirm-icon" aria-hidden>
        <Mail className="h-5 w-5" />
      </span>
      <h3 id="signup-confirm-title" className="auth-signup-confirm-title">
        {t('auth.confirmEmailTitle')}
      </h3>
      <p className="auth-signup-confirm-message">
        {t('auth.confirmEmailMessage')}
      </p>
      {email && (
        <p className="auth-signup-confirm-email">
          <span className="sr-only">{t('auth.emailAddress')}: </span>
          {email}
        </p>
      )}
      {resendSent && (
        <p className="auth-signup-confirm-sent" role="status">
          {t('auth.confirmEmailResent')}
        </p>
      )}
      <div className="auth-signup-confirm-actions">
        <button
          type="button"
          onClick={onResend}
          disabled={resendLoading || resendDisabled}
          className="auth-premium-submit auth-signup-confirm-resend"
          aria-busy={resendLoading}
        >
          {resendLoading ? (
            <>
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
              {t('auth.confirmEmailResending')}
            </>
          ) : (
            t('auth.resendConfirmation')
          )}
        </button>
        <Link to="/login" state={authLinkState} className="auth-signup-confirm-login">
          {t('auth.backToLogin')}
        </Link>
      </div>
    </section>
  )
}
