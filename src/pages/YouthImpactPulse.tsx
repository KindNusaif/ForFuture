import { Activity, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import AsyncLoadHint from '../components/AsyncLoadHint'
import ImpactPulseCta from '../components/impact-pulse/ImpactPulseCta'
import ImpactPulseDistricts from '../components/impact-pulse/ImpactPulseDistricts'
import ImpactPulseGlance from '../components/impact-pulse/ImpactPulseGlance'
import ImpactPulseJourney from '../components/impact-pulse/ImpactPulseJourney'
import ImpactPulseParticipation from '../components/impact-pulse/ImpactPulseParticipation'
import ImpactPulseSpotlight from '../components/impact-pulse/ImpactPulseSpotlight'
import ImpactPulseThemes from '../components/impact-pulse/ImpactPulseThemes'
import ImpactPulseTrust from '../components/impact-pulse/ImpactPulseTrust'
import ImpactPulseWeekly from '../components/impact-pulse/ImpactPulseWeekly'
import { useAuth } from '../hooks/useAuth'
import { useImpactPulseData } from '../hooks/useImpactPulseData'
import { useLoadingProgress } from '../hooks/useLoadingProgress'

export default function YouthImpactPulse() {
  const { t } = useTranslation()
  const { isMember } = useAuth()
  const { data, loading, error, needsMigration, reload } = useImpactPulseData()
  const { showSlowHint, showRecovery } = useLoadingProgress(loading)
  const detailBase = isMember ? '/feed' : '/explore'

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
      <header className="relative mb-10 overflow-hidden rounded-3xl border border-accent-200/60 bg-linear-to-br from-brand-950 via-accent-900 to-slate-900 px-6 py-10 text-white shadow-xl sm:px-10 sm:py-12">
        <div className="pointer-events-none absolute -right-16 top-0 h-56 w-56 rounded-full bg-accent-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-0 h-48 w-48 rounded-full bg-brand-400/15 blur-3xl" />
        <div className="relative">
          <p className="eyebrow inline-flex items-center gap-2 text-accent-200">
            <Activity className="h-4 w-4" aria-hidden />
            {t('impactPulse.eyebrow')}
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
            {t('impactPulse.heroTitle')}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-200 sm:text-base">
            {t('impactPulse.heroSubtitle')}
          </p>
          <p className="mt-2 text-xs font-medium uppercase tracking-wider text-accent-200/90">
            {t('impactPulse.tagline')}
          </p>
        </div>
      </header>

      {needsMigration && (
        <div
          role="alert"
          className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950"
        >
          <p className="font-semibold">{t('impactPulse.migrationTitle')}</p>
          <p className="mt-1 leading-relaxed">{t('impactPulse.migrationBody')}</p>
        </div>
      )}

      {error && !needsMigration && (
        <div
          role="alert"
          className="mb-8 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-900 sm:flex-row sm:items-center sm:justify-between"
        >
          <p>{error}</p>
          <button type="button" onClick={() => void reload()} className="btn-secondary !min-h-10 shrink-0">
            <RefreshCw className="h-4 w-4" aria-hidden />
            {t('loading.retry')}
          </button>
        </div>
      )}

      <AsyncLoadHint showSlowHint={showSlowHint} showRecovery={showRecovery} onRetry={() => void reload()} />

      <div className="space-y-14 sm:space-y-16 lg:space-y-20">
        <ImpactPulseGlance glance={data.glance} loading={loading} />
        <ImpactPulseJourney journey={data.journey} loading={loading} />
        <ImpactPulseWeekly weekly={data.weekly} loading={loading} />
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-8 xl:gap-12">
          <ImpactPulseThemes categories={data.categories} loading={loading} />
          <ImpactPulseDistricts districts={data.districts} loading={loading} />
        </div>
        <ImpactPulseParticipation participation={data.participation} loading={loading} />
        <ImpactPulseTrust trust={data.trust} loading={loading} />
        <ImpactPulseSpotlight spotlight={data.spotlight} detailBase={detailBase} loading={loading} />
        <ImpactPulseCta isMember={isMember} />
      </div>
    </div>
  )
}
