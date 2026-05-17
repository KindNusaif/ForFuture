import { Link } from 'react-router-dom'
import { Compass, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function DiscoverHero() {
  const { t } = useTranslation()

  return (
    <header className="relative overflow-hidden rounded-3xl border border-accent-200/50 bg-linear-to-br from-brand-950 via-accent-900 to-slate-900 px-6 py-12 text-white shadow-xl sm:px-10 sm:py-14">
      <div className="pointer-events-none absolute -right-20 top-0 h-64 w-64 rounded-full bg-accent-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-0 h-56 w-56 rounded-full bg-brand-400/15 blur-3xl" />
      <div className="relative mx-auto max-w-3xl text-center">
        <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-accent-100">
          <Compass className="h-4 w-4" aria-hidden />
          {t('discover.heroEyebrow')}
        </p>
        <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
          {t('discover.heroTitle')}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-200 sm:text-base">
          {t('discover.heroSubtitle')}
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to="/movements" className="btn-secondary w-full border-white/20 bg-white/10 text-white hover:bg-white/20 sm:w-auto">
            {t('discover.browseMovements')}
          </Link>
          <Link to="/signup" className="btn-primary w-full sm:w-auto">
            <Sparkles className="h-4 w-4" aria-hidden />
            {t('discover.joinForFuture')}
          </Link>
        </div>
      </div>
    </header>
  )
}
