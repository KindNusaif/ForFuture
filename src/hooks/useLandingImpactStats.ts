import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAsyncLoad } from './useAsyncLoad'
import {
  buildAspirationalStats,
  fetchLandingImpactStats,
  type LandingStatItem,
} from '../lib/landingStats'

export function useLandingImpactStats() {
  const { t } = useTranslation()

  const labels = useMemo(
    () => ({
      aspireVoices: t('landing.statAspireVoices'),
      aspireActions: t('landing.statAspireActions'),
      aspireVolunteer: t('landing.statAspireVolunteer'),
      liveMovements: t('landing.statLiveMovements'),
      liveVolunteer: t('landing.statLiveVolunteer'),
      liveEngagements: t('landing.statLiveEngagements'),
    }),
    [t],
  )

  const fallbackStats = useMemo(
    () =>
      buildAspirationalStats({
        voices: labels.aspireVoices,
        actions: labels.aspireActions,
        volunteer: labels.aspireVolunteer,
      }),
    [labels],
  )

  const labelDeps = [
    labels.aspireVoices,
    labels.aspireActions,
    labels.aspireVolunteer,
    labels.liveMovements,
    labels.liveVolunteer,
    labels.liveEngagements,
  ]

  const { data, isLoading } = useAsyncLoad(
    (signal) => fetchLandingImpactStats({ signal, labels }),
    { deps: labelDeps },
  )

  const mode = data?.mode ?? 'aspirational'
  const stats: LandingStatItem[] = data?.stats ?? fallbackStats
  const hasData = Boolean(data?.stats?.length)

  return {
    mode,
    stats,
    loading: isLoading,
    hasData,
  }
}
