import { useEffect } from 'react'
import { Compass, Loader2 } from 'lucide-react'
import { Navigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PostFeed from '../components/PostFeed'
import GuestExploreBanner from '../components/guest/GuestExploreBanner'
import { useAuthUser } from '../hooks/useAuthUser'

export default function Explore() {
  const { t } = useTranslation()
  const location = useLocation()
  const { isMember, loading, authReady, loggingOut } = useAuthUser()

  useEffect(() => {
    const previous = document.title
    document.title = `${t('explore.pageTitle', { defaultValue: 'Explore' })} · ForFuture`
    return () => {
      document.title = previous
    }
  }, [t])

  useEffect(() => {
    document.documentElement.dataset.guestExplore = 'true'
    return () => {
      delete document.documentElement.dataset.guestExplore
    }
  }, [])

  if (!loading && isMember) {
    return <Navigate to={`/feed${location.search}`} replace />
  }

  if (!authReady || loading || loggingOut) {
    return (
      <main className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-4">
        <Loader2
          className="motion-essential h-8 w-8 animate-spin text-accent-600"
          aria-hidden
        />
        <p className="text-sm text-secondary" role="status" aria-live="polite">
          {t('explore.loadingMovements', { defaultValue: 'Loading youth movements…' })}
        </p>
      </main>
    )
  }

  return (
    <div
      className="mx-auto min-w-0 max-w-3xl px-4 py-6 sm:px-6 lg:max-w-4xl lg:py-8"
      data-track="guest-explore-opened"
    >
      <GuestExploreBanner />

      <header className="movements-page-header mb-6 border-b border-default pb-6">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent-50 text-accent-700 ring-1 ring-accent-200/80">
            <Compass className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h1 className="page-title text-2xl sm:text-3xl">
              {t('explore.heading', { defaultValue: 'Explore youth movements' })}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-secondary sm:text-base">
              {t('explore.subtitle', {
                defaultValue:
                  'Browse public civic actions from youth across the community — no account required.',
              })}
            </p>
          </div>
        </div>
      </header>

      <PostFeed mode="guest" showCreateButton={false} syncFiltersFromUrl />
    </div>
  )
}
