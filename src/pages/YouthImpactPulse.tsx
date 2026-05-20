import { Activity, RefreshCw } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import AsyncLoadHint from '../components/AsyncLoadHint'
import ImpactPulseCta from '../components/impact-pulse/ImpactPulseCta'
import ImpactPulseDistricts from '../components/impact-pulse/ImpactPulseDistricts'
import ImpactPulseGlance from '../components/impact-pulse/ImpactPulseGlance'
import ImpactPulseJourney from '../components/impact-pulse/ImpactPulseJourney'
import ImpactPulseParticipation from '../components/impact-pulse/ImpactPulseParticipation'
import ImpactPulseSpotlight from '../components/impact-pulse/ImpactPulseSpotlight'
import ImpactPulseStoryRibbon from '../components/impact-pulse/ImpactPulseStoryRibbon'
import ImpactPulseThemes from '../components/impact-pulse/ImpactPulseThemes'
import ImpactPulseTrust from '../components/impact-pulse/ImpactPulseTrust'
import ImpactPulseWeekly from '../components/impact-pulse/ImpactPulseWeekly'
import { useAuth } from '../hooks/useAuth'
import { useImpactPulseData } from '../hooks/useImpactPulseData'
import { useLoadingProgress } from '../hooks/useLoadingProgress'
import i18n from '../i18n'

function formatLiveUpdated(iso: string): string {
  try {
    return new Intl.DateTimeFormat(i18n.language, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return ''
  }
}

export default function YouthImpactPulse() {
  const { t } = useTranslation()
  const { isMember } = useAuth()
  const { data, loading, error, needsMigration, reload } = useImpactPulseData()
  const { showSlowHint, showRecovery } = useLoadingProgress(loading)
  const detailBase = isMember ? '/feed' : '/explore'
  const unavailable = needsMigration

  const liveUpdatedLabel = useMemo(() => {
    if (unavailable || loading || !data.generated_at) return null
    const when = formatLiveUpdated(data.generated_at)
    return when ? t('impactPulse.liveUpdated', { time: when }) : null
  }, [unavailable, loading, data.generated_at, t])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
      <header className="impact-page-hero relative mb-10 overflow-hidden px-6 py-10 sm:px-10 sm:py-12">
        <div className="pointer-events-none absolute -right-16 top-0 h-56 w-56 rounded-full bg-accent-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-0 h-48 w-48 rounded-full bg-brand-400/15 blur-3xl" />
        <div className="relative">
          <p className="eyebrow inline-flex items-center gap-2 text-accent-200">
            <Activity className="h-4 w-4" aria-hidden />
            {t('impactPulse.eyebrow')}
          </p>
          <h1 className="mt-3 text-3xl sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
            {t('impactPulse.heroTitle')}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">
            {t('impactPulse.heroSubtitle')}
          </p>
          <p className="mt-2 text-xs font-medium uppercase tracking-wider text-accent-200/90">
            {t('impactPulse.tagline')}
          </p>
          <ImpactPulseStoryRibbon />
          {liveUpdatedLabel && (
            <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-surface/10 px-3 py-1.5 text-xs font-medium text-accent-100">
              <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" aria-hidden />
              {liveUpdatedLabel}
            </p>
          )}
        </div>
      </header>

      {needsMigration && (
        <div
          role="alert"
          className="alert-warning mb-8 px-4 py-4 text-sm"
        >
          <p className="font-semibold">{t('impactPulse.migrationTitle')}</p>
          <p className="mt-1 leading-relaxed">{t('impactPulse.migrationBody')}</p>
        </div>
      )}

      {error && !needsMigration && (
        <div
          role="alert"
          className="alert-error mb-8 flex flex-col gap-3 px-4 py-4 text-sm sm:flex-row sm:items-center sm:justify-between"
        >
          <p>{error}</p>
          <button type="button" onClick={() => void reload()} className="btn-secondary min-h-10! shrink-0">
            <RefreshCw className="h-4 w-4" aria-hidden />
            {t('loading.retry')}
          </button>
        </div>
      )}

      <AsyncLoadHint showSlowHint={showSlowHint} showRecovery={showRecovery} onRetry={() => void reload()} />

      <div className="space-y-14 sm:space-y-16 lg:space-y-20">
        <ImpactPulseGlance glance={data.glance} loading={loading} unavailable={unavailable} />
        <ImpactPulseJourney journey={data.journey} loading={loading} unavailable={unavailable} />
        <ImpactPulseWeekly weekly={data.weekly} loading={loading} unavailable={unavailable} />
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-8 xl:gap-12">
          <ImpactPulseThemes categories={data.categories} loading={loading} unavailable={unavailable} />
          <ImpactPulseDistricts districts={data.districts} loading={loading} unavailable={unavailable} />
        </div>
        <ImpactPulseParticipation
          participation={data.participation}
          loading={loading}
          unavailable={unavailable}
        />
        <ImpactPulseSpotlight
          spotlight={data.spotlight}
          detailBase={detailBase}
          loading={loading}
          unavailable={unavailable}
        />
        <ImpactPulseTrust trust={data.trust} loading={loading} unavailable={unavailable} />
        <ImpactPulseCta isMember={isMember} />
      </div>
    </div>
  )
}
