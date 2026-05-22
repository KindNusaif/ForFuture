import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { authStateFromPath, buildAuthReturn } from '../../lib/authReturn'
import { dismissGuestBanner, isGuestBannerDismissed } from '../../lib/guidanceStorage'

interface GuestModeBannerProps {
  className?: string
  trackId?: string
}

export default function GuestModeBanner({ className = '', trackId = 'guest-mode-banner' }: GuestModeBannerProps) {
  const { t } = useTranslation()
  const location = useLocation()
  const [hidden, setHidden] = useState(isGuestBannerDismissed)

  const authState = authStateFromPath(
    buildAuthReturn(location.pathname, location.search, location.hash),
  )

  if (hidden) return null

  function handleContinue() {
    dismissGuestBanner()
    setHidden(true)
  }

  return (
    <div
      className={`guest-explore-banner guidance-guest-banner ${className}`}
      role="status"
      data-track={trackId}
    >
      <div className="guest-explore-banner-inner">
        <span className="guest-explore-banner-icon" aria-hidden>
          <Sparkles className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-primary">
            {t('guidance.guest.title', { defaultValue: 'Exploring as a guest' })}
          </p>
          <p className="guest-explore-banner-text mt-1">
            {t('guidance.guest.description', {
              defaultValue:
                'You can browse public movements freely. Create an account to follow, sign, vote, volunteer, comment, or create your own movement.',
            })}
          </p>
        </div>
        <div className="guest-explore-banner-actions">
          <Link
            to="/signup"
            state={authState}
            className="btn-primary guest-explore-banner-cta"
            data-track="guest-signup-cta-clicked"
          >
            {t('guidance.guest.join', { defaultValue: 'Join the Movement' })}
          </Link>
          <Link
            to="/login"
            state={authState}
            className="btn-ghost guest-explore-banner-login"
            data-track="guest-login-cta-clicked"
          >
            {t('guidance.guest.login', { defaultValue: 'Log in' })}
          </Link>
          <button
            type="button"
            className="btn-ghost text-sm"
            onClick={handleContinue}
          >
            {t('guidance.guest.continue', { defaultValue: 'Continue Exploring' })}
          </button>
        </div>
      </div>
    </div>
  )
}
