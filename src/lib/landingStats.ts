import type { LucideIcon } from 'lucide-react'
import { HandHeart, Megaphone, Rocket } from 'lucide-react'
import {
  fetchImpactPulseDashboard,
  formatImpactCountFull,
  isRpcMissing,
  type ImpactPulseParticipation,
} from './impactPulse'
import { DEFAULT_REQUEST_TIMEOUT_MS } from './requestConfig'
import { isRequestAborted, withTimeout } from './supabaseRequest'

export type LandingStatsMode = 'live' | 'aspirational'

export interface LandingStatItem {
  value: string
  label: string
  icon: LucideIcon
}

export function sumMeaningfulEngagements(participation: ImpactPulseParticipation): number {
  return (
    participation.movement_supports +
    participation.volunteer_responses +
    participation.petition_signatures +
    participation.fundraising_support +
    participation.relief_blood +
    participation.relief_items
  )
}

export function buildAspirationalStats(labels: {
  voices: string
  actions: string
  volunteer: string
}): LandingStatItem[] {
  return [
    { value: '10K+', label: labels.voices, icon: Megaphone },
    { value: '500+', label: labels.actions, icon: Rocket },
    { value: '200+', label: labels.volunteer, icon: HandHeart },
  ]
}

export function buildLiveStats(
  glance: { movements_launched: number; volunteer_drives: number },
  participation: ImpactPulseParticipation,
  labels: {
    movements: string
    volunteer: string
    engagements: string
  },
): LandingStatItem[] {
  return [
    {
      value: formatImpactCountFull(glance.movements_launched),
      label: labels.movements,
      icon: Rocket,
    },
    {
      value: formatImpactCountFull(glance.volunteer_drives),
      label: labels.volunteer,
      icon: HandHeart,
    },
    {
      value: formatImpactCountFull(sumMeaningfulEngagements(participation)),
      label: labels.engagements,
      icon: Megaphone,
    },
  ]
}

export async function fetchLandingImpactStats(options?: {
  signal?: AbortSignal
  labels: {
    aspireVoices: string
    aspireActions: string
    aspireVolunteer: string
    liveMovements: string
    liveVolunteer: string
    liveEngagements: string
  }
}): Promise<{ mode: LandingStatsMode; stats: LandingStatItem[] }> {
  const labels = options?.labels
  if (!labels) {
    throw new Error('landingStats labels required')
  }

  const aspirational = {
    mode: 'aspirational' as const,
    stats: buildAspirationalStats({
      voices: labels.aspireVoices,
      actions: labels.aspireActions,
      volunteer: labels.aspireVolunteer,
    }),
  }

  try {
    const dashboard = await withTimeout(
      fetchImpactPulseDashboard({ signal: options?.signal }),
      DEFAULT_REQUEST_TIMEOUT_MS,
      undefined,
      options?.signal,
    )
    return {
      mode: 'live',
      stats: buildLiveStats(dashboard.glance, dashboard.participation, {
        movements: labels.liveMovements,
        volunteer: labels.liveVolunteer,
        engagements: labels.liveEngagements,
      }),
    }
  } catch (error) {
    if (isRequestAborted(error)) throw error
    if (!isRpcMissing(error)) {
      return aspirational
    }
    return aspirational
  }
}
