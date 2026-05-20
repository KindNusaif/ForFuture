import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Sparkles } from 'lucide-react'
import { authStateFromPath, buildAuthReturn } from '../../lib/authReturn'

export default function GuestExploreBanner() {
  const { t } = useTranslation()
  const location = useLocation()
  const authState = authStateFromPath(
    buildAuthReturn(location.pathname, location.search, location.hash),
  )

  return (
    <div
      className="guest-explore-banner"
      role="status"
      data-track="guest-explore-banner"
    >
      <div className="guest-explore-banner-inner">
        <span className="guest-explore-banner-icon" aria-hidden>
          <Sparkles className="h-4 w-4" />
        </span>
        <p className="guest-explore-banner-text">
          {t('explore.guestBanner')}
        </p>
        <div className="guest-explore-banner-actions">
          <Link
            to="/signup"
            state={authState}
            className="btn-primary guest-explore-banner-cta"
            data-track="guest-signup-cta-clicked"
          >
            {t('explore.guestJoin')}
          </Link>
          <Link
            to="/login"
            state={authState}
            className="btn-ghost guest-explore-banner-login"
            data-track="guest-login-cta-clicked"
          >
            {t('explore.guestLogin')}
          </Link>
        </div>
      </div>
    </div>
  )
}
