import { Link } from 'react-router-dom'
import { Compass, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { scrollToDiscoverTrending } from '../../hooks/useDiscoverNearbyFocus'

export default function DiscoverHero() {
  const { t } = useTranslation()

  return (
    <header className="impact-page-hero discover-hero relative overflow-hidden px-6 py-9 sm:px-10 sm:py-11">
      <div className="pointer-events-none absolute -right-20 top-0 h-64 w-64 rounded-full bg-accent-400/20 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-24 left-0 h-56 w-56 rounded-full bg-brand-400/15 blur-3xl" aria-hidden />
      <div className="relative mx-auto max-w-3xl text-center">
        <p className="discover-hero-eyebrow inline-flex items-center gap-2 rounded-full border border-white/15 bg-surface/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider">
          <Compass className="h-4 w-4" aria-hidden />
          {t('discover.heroEyebrow')}
        </p>
        <h1 className="discover-hero-title mt-4 text-3xl sm:text-4xl lg:text-[2.65rem]">
          {t('discover.heroTitle')}
        </h1>
        <p className="discover-hero-subtitle mx-auto mt-3 max-w-2xl text-sm leading-relaxed sm:text-base">
          {t('discover.heroSubtitle')}
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={scrollToDiscoverTrending}
            className="btn-secondary w-full border-white/20 bg-surface/10 text-white hover:bg-surface/20 sm:w-auto"
          >
            {t('discover.browseMovements')}
          </button>
          <Link to="/signup" className="btn-primary w-full sm:w-auto">
            <Sparkles className="h-4 w-4" aria-hidden />
            {t('discover.joinToTakeAction')}
          </Link>
        </div>
      </div>
    </header>
  )
}
