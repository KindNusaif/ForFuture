import { HandHeart, Megaphone, Rocket } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLandingImpactStats } from '../../hooks/useLandingImpactStats'
import LandingStatCard from './LandingStatCard'

const SKELETON_ICONS = [Rocket, HandHeart, Megaphone] as const

export default function LandingImpactStats() {
  const { t } = useTranslation()
  const { mode, stats, loading, hasData } = useLandingImpactStats()
  const isLive = mode === 'live'
  const showSkeleton = loading && !hasData

  return (
    <aside className="min-w-0" aria-labelledby="landing-impact-stats-heading">
      <header className="mb-5">
        <p className="eyebrow mb-2">
          {isLive ? t('landing.statsLiveEyebrow') : t('landing.statsAspireEyebrow')}
        </p>
        <h2
          id="landing-impact-stats-heading"
          className="text-xl font-bold tracking-tight text-primary sm:text-2xl"
        >
          {isLive ? t('landing.statsLiveTitle') : t('landing.statsAspireTitle')}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-secondary">
          {isLive ? t('landing.statsLiveSubtitle') : t('landing.statsAspireSubtitle')}
        </p>
        {isLive && !loading && (
          <p className="mt-2 text-xs font-medium text-accent-700 dark:text-accent-300">
            {t('landing.statsLiveNote')}
          </p>
        )}
      </header>

      <ul className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
        {showSkeleton
          ? SKELETON_ICONS.map((Icon, index) => (
              <li key={`skeleton-${index}`}>
                <LandingStatCard value="" label="" icon={Icon} loading />
              </li>
            ))
          : stats.map((item) => (
              <li key={item.label}>
                <LandingStatCard
                  value={item.value}
                  label={item.label}
                  icon={item.icon}
                  live={isLive}
                />
              </li>
            ))}
      </ul>
    </aside>
  )
}
