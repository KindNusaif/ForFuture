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
import { useDataSync } from '../hooks/useDataSync'
import { useRouteFocusRefetch } from '../hooks/useRouteFocusRefetch'
import { useVisibilityRefetch } from '../hooks/useVisibilityRefetch'
import { useAuthUser } from '../hooks/useAuthUser'
import { usePageMeta } from '../hooks/usePageMeta'

function DiscoverGuestContent() {
  const { t } = useTranslation()
  const { data, loading, error, reload } = useDiscoverData(true)

  useDataSync((event) => {
    if (
      event.type === 'feed:invalidate' ||
      event.type === 'post:created' ||
      event.type === 'post:updated' ||
      event.type === 'post:deleted' ||
      event.type === 'polls:invalidate' ||
      event.type === 'follows:invalidate'
    ) {
      reload()
    }
  })

  useVisibilityRefetch(reload, { enabled: !loading })
  useRouteFocusRefetch(reload, { pathPrefixes: ['/discover'], enabled: !loading })

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
      <main className="mx-auto min-w-0 max-w-7xl px-4 py-6 sm:px-6 lg:py-8" aria-busy="true">
        <div className="space-y-3" aria-hidden>
          <div className="skeleton-shimmer h-10 w-56 max-w-full rounded-xl" />
          <div className="skeleton-shimmer h-4 w-full max-w-lg rounded" />
          <div className="skeleton-shimmer mt-6 h-48 w-full rounded-2xl" />
        </div>
      </main>
    )
  }

  if (isMember) {
    return <Navigate to="/feed" replace />
  }

  return <DiscoverGuestPage />
}

function DiscoverGuestPage() {
  const { t } = useTranslation()
  useDiscoverNearbyFocus()

  usePageMeta({
    title: t('discover.pageTitle', { defaultValue: 'Discover' }),
    description: t('discover.metaDescription', {
      defaultValue: 'Explore trending youth movements, categories, and civic momentum across your community.',
    }),
    path: '/discover',
  })

  return (
    <div className="mx-auto min-w-0 max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
      <DiscoverGuestBanner />
      <DiscoverHero />
      <DiscoverNearbySection />
      <DiscoverGuestContent />
    </div>
  )
}

