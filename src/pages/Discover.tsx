import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import DiscoverHero from '../components/discover/DiscoverHero'
import DiscoverTrendingSection from '../components/discover/DiscoverTrendingSection'
import DiscoverCategoriesSection from '../components/discover/DiscoverCategoriesSection'
import DiscoverMovementTypesSection from '../components/discover/DiscoverMovementTypesSection'
import DiscoverFeaturedSection from '../components/discover/DiscoverFeaturedSection'
import DiscoverImpactPreview from '../components/discover/DiscoverImpactPreview'
import DiscoverVisitorCta from '../components/discover/DiscoverVisitorCta'
import { useDiscoverData } from '../hooks/useDiscoverData'
import { useAuthUser } from '../hooks/useAuthUser'

export default function Discover() {
  const { t } = useTranslation()
  const { isMember, loading: authLoading } = useAuthUser()
  const { data, loading, error, reload } = useDiscoverData()

  if (!authLoading && isMember) {
    return <Navigate to="/feed" replace />
  }

  return (
    <div className="mx-auto min-w-0 max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
      <DiscoverHero />

      {error && (
        <div
          role="alert"
          className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950"
        >
          <p className="font-semibold">{t('discover.loadErrorTitle')}</p>
          <p className="mt-1">{error}</p>
          <button type="button" onClick={() => reload()} className="btn-secondary mt-3 min-h-9!">
            {t('discover.retry')}
          </button>
        </div>
      )}

      <div className="mt-10 space-y-2">
        <DiscoverTrendingSection items={data.trending} loading={loading} error={null} />
        <DiscoverCategoriesSection counts={data.categoryCounts} loading={loading} />
        <DiscoverMovementTypesSection />
        <DiscoverFeaturedSection
          volunteer={data.featured.volunteer}
          civic={data.featured.civic}
          rising={data.featured.rising}
          loading={loading}
        />
        <DiscoverImpactPreview glance={data.impact.glance} loading={loading} />
        <DiscoverVisitorCta />
      </div>
    </div>
  )
}
