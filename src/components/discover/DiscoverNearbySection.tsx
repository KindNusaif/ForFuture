import { Link } from 'react-router-dom'
import { ArrowRight, Map, MapPin } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function DiscoverNearbySection() {
  const { t } = useTranslation()

  return (
    <section
      id="nearby-actions"
      className="discover-nearby-section scroll-mt-24"
      aria-labelledby="discover-nearby-heading"
    >
      <div className="discover-nearby-card">
        <div className="discover-nearby-icon" aria-hidden>
          <MapPin className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="discover-nearby-eyebrow">{t('discover.nearbyEyebrow')}</p>
          <h2 id="discover-nearby-heading" className="discover-nearby-title">
            {t('discover.nearbyTitle')}
          </h2>
          <p className="discover-nearby-subtitle">{t('discover.nearbySubtitle')}</p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Link to="/impact-map" className="btn-primary w-full sm:w-auto">
              <Map className="h-4 w-4" aria-hidden />
              {t('discover.nearbyExploreMap')}
            </Link>
            <Link to="/explore" className="btn-secondary w-full sm:w-auto">
              {t('discover.nearbyBrowseExplore')}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
