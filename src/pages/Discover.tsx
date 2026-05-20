import { Loader2 } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import DiscoverGuestBanner from '../components/discover/DiscoverGuestBanner'
import DiscoverHero from '../components/discover/DiscoverHero'
import DiscoverNearbySection from '../components/discover/DiscoverNearbySection'
import DiscoverTrendingSection from '../components/discover/DiscoverTrendingSection'
import { useDiscoverNearbyFocus } from '../hooks/useDiscoverNearbyFocus'
import DiscoverCategoriesSection from '../components/discover/DiscoverCategoriesSection'
import DiscoverMovementTypesSection from '../components/discover/DiscoverMovementTypesSection'
import DiscoverFeaturedSection from '../components/discover/DiscoverFeaturedSection'
import DiscoverImpactPreview from '../components/discover/DiscoverImpactPreview'
import DiscoverVisitorCta from '../components/discover/DiscoverVisitorCta'
import { useDiscoverData } from '../hooks/useDiscoverData'
import { useAuthUser } from '../hooks/useAuthUser'

function DiscoverGuestContent() {
  const { t } = useTranslation()
  const { data, loading, error, reload } = useDiscoverData(true)

  return (
    <>
      {error && (
        <div
          role="alert"
          className="alert-warning mt-6 px-4 py-4 text-sm"
        >
          <p className="font-semibold">{t('discover.loadErrorTitle')}</p>
          <p className="mt-1">{error}</p>
          <button type="button" onClick={() => reload()} className="btn-secondary mt-3 min-h-9!">
            {t('discover.retry')}
          </button>
        </div>
      )}

      <div className="mt-6 space-y-1 sm:mt-8">
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
    </>
  )
}

export default function Discover() {
  const { isMember, loading: authLoading } = useAuthUser()

  if (authLoading) {
    return (
      <main className="flex min-h-[40vh] items-center justify-center px-4">
        <Loader2 className="motion-essential h-8 w-8 animate-spin text-accent-600" aria-label="Loading" />
      </main>
    )
  }

  if (isMember) {
    return <Navigate to="/feed" replace />
  }

  return <DiscoverGuestPage />
}

function DiscoverGuestPage() {
  useDiscoverNearbyFocus()

  return (
    <div className="mx-auto min-w-0 max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
      <DiscoverGuestBanner />
      <DiscoverHero />
      <DiscoverNearbySection />
      <DiscoverGuestContent />
    </div>
  )
}

