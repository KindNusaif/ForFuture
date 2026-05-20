import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { authStateFromPath, buildAuthReturn } from '../../lib/authReturn'

export default function DiscoverGuestBanner() {
  const { t } = useTranslation()
  const location = useLocation()
  const authState = authStateFromPath(
    buildAuthReturn(location.pathname, location.search, location.hash),
  )

  return (
    <div
      className="discover-guest-banner"
      role="status"
      data-track="discover-guest-banner"
    >
      <div className="discover-guest-banner-inner">
        <p className="discover-guest-banner-text">{t('discover.guestBanner')}</p>
        <div className="discover-guest-banner-actions">
          <Link
            to="/signup"
            state={authState}
            className="btn-primary discover-guest-banner-cta"
            data-track="discover-guest-signup"
          >
            {t('discover.guestCreateAccount')}
          </Link>
          <Link
            to="/login"
            state={authState}
            className="btn-ghost discover-guest-banner-login"
            data-track="discover-guest-login"
          >
            {t('discover.guestLogIn')}
          </Link>
        </div>
      </div>
    </div>
  )
}
