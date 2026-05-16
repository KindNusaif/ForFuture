import i18n from '../i18n'
import { requireSupabase } from './supabase'
import { enhanceSupabaseError } from './supabaseErrors'
import { withAutoRetry } from './supabaseRequest'
import type { MovementType } from '../types'

export interface ImpactPulseGlance {
  youth_voices_shared: number
  movements_launched: number
  petitions_started: number
  volunteer_drives: number
  relief_causes: number
  poll_votes: number
}

export interface ImpactPulseJourney {
  voices_raised: number
  petitions_created: number
  volunteer_drives: number
  relief_causes: number
  trusted_reviewed: number
}

export interface ImpactPulseWeeklyMovement {
  id: string
  title: string
  movement_type: MovementType
  category: string
  engagement_count: number
}

export interface ImpactPulseWeeklyPetition {
  id: string
  title: string
  category: string
  movement_type: MovementType
  week_signatures: number
  total_signatures: number
}

export interface ImpactPulseCategoryRow {
  category: string
  count: number
  share: number
}

export interface ImpactPulseDistrictRow {
  district: string
  count: number
}

export interface ImpactPulseParticipation {
  poll_votes: number
  petition_signatures: number
  volunteer_responses: number
  relief_blood: number
  relief_items: number
  fundraising_support: number
  movement_supports: number
}

export interface ImpactPulseTrust {
  verified_organizers: number
  reviewed_campaigns: number
  trusted_fundraising: number
  reports_processed: number
  youth_voice_posts: number
}

export interface ImpactPulseSpotlight {
  id: string
  title: string
  movement_type: MovementType
  category: string
  posting_identity: string
  youth_voice_id: string | null
  public_author_name: string
  engagement_count: number
  review_status: string | null
  reviewed_campaign_type: string | null
}

export interface ImpactPulseDashboard {
  generated_at: string
  glance: ImpactPulseGlance
  journey: ImpactPulseJourney
  weekly: {
    most_supported: ImpactPulseWeeklyMovement | null
    fastest_petition: ImpactPulseWeeklyPetition | null
    top_movement_type: MovementType | null
    top_category: string | null
  }
  categories: ImpactPulseCategoryRow[]
  districts: ImpactPulseDistrictRow[]
  participation: ImpactPulseParticipation
  trust: ImpactPulseTrust
  spotlight: ImpactPulseSpotlight | null
}

const EMPTY_GLANCE: ImpactPulseGlance = {
  youth_voices_shared: 0,
  movements_launched: 0,
  petitions_started: 0,
  volunteer_drives: 0,
  relief_causes: 0,
  poll_votes: 0,
}

const EMPTY_JOURNEY: ImpactPulseJourney = {
  voices_raised: 0,
  petitions_created: 0,
  volunteer_drives: 0,
  relief_causes: 0,
  trusted_reviewed: 0,
}

const EMPTY_PARTICIPATION: ImpactPulseParticipation = {
  poll_votes: 0,
  petition_signatures: 0,
  volunteer_responses: 0,
  relief_blood: 0,
  relief_items: 0,
  fundraising_support: 0,
  movement_supports: 0,
}

const EMPTY_TRUST: ImpactPulseTrust = {
  verified_organizers: 0,
  reviewed_campaigns: 0,
  trusted_fundraising: 0,
  reports_processed: 0,
  youth_voice_posts: 0,
}

export const EMPTY_IMPACT_PULSE: ImpactPulseDashboard = {
  generated_at: new Date().toISOString(),
  glance: EMPTY_GLANCE,
  journey: EMPTY_JOURNEY,
  weekly: {
    most_supported: null,
    fastest_petition: null,
    top_movement_type: null,
    top_category: null,
  },
  categories: [],
  districts: [],
  participation: EMPTY_PARTICIPATION,
  trust: EMPTY_TRUST,
  spotlight: null,
}

function asNumber(value: unknown, fallback = 0): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function parseDashboard(raw: unknown): ImpactPulseDashboard {
  const data = (raw ?? {}) as Record<string, unknown>
  const glance = (data.glance ?? {}) as Record<string, unknown>
  const journey = (data.journey ?? {}) as Record<string, unknown>
  const weekly = (data.weekly ?? {}) as Record<string, unknown>
  const participation = (data.participation ?? {}) as Record<string, unknown>
  const trust = (data.trust ?? {}) as Record<string, unknown>

  return {
    generated_at: typeof data.generated_at === 'string' ? data.generated_at : new Date().toISOString(),
    glance: {
      youth_voices_shared: asNumber(glance.youth_voices_shared),
      movements_launched: asNumber(glance.movements_launched),
      petitions_started: asNumber(glance.petitions_started),
      volunteer_drives: asNumber(glance.volunteer_drives),
      relief_causes: asNumber(glance.relief_causes),
      poll_votes: asNumber(glance.poll_votes),
    },
    journey: {
      voices_raised: asNumber(journey.voices_raised),
      petitions_created: asNumber(journey.petitions_created),
      volunteer_drives: asNumber(journey.volunteer_drives),
      relief_causes: asNumber(journey.relief_causes),
      trusted_reviewed: asNumber(journey.trusted_reviewed),
    },
    weekly: {
      most_supported: (weekly.most_supported as ImpactPulseWeeklyMovement | null) ?? null,
      fastest_petition: (weekly.fastest_petition as ImpactPulseWeeklyPetition | null) ?? null,
      top_movement_type: (weekly.top_movement_type as MovementType | null) ?? null,
      top_category: (weekly.top_category as string | null) ?? null,
    },
    categories: Array.isArray(data.categories)
      ? (data.categories as ImpactPulseCategoryRow[])
      : [],
    districts: Array.isArray(data.districts)
      ? (data.districts as ImpactPulseDistrictRow[])
      : [],
    participation: {
      poll_votes: asNumber(participation.poll_votes),
      petition_signatures: asNumber(participation.petition_signatures),
      volunteer_responses: asNumber(participation.volunteer_responses),
      relief_blood: asNumber(participation.relief_blood),
      relief_items: asNumber(participation.relief_items),
      fundraising_support: asNumber(participation.fundraising_support),
      movement_supports: asNumber(participation.movement_supports),
    },
    trust: {
      verified_organizers: asNumber(trust.verified_organizers),
      reviewed_campaigns: asNumber(trust.reviewed_campaigns),
      trusted_fundraising: asNumber(trust.trusted_fundraising),
      reports_processed: asNumber(trust.reports_processed),
      youth_voice_posts: asNumber(trust.youth_voice_posts),
    },
    spotlight: (data.spotlight as ImpactPulseSpotlight | null) ?? null,
  }
}

export function formatImpactCount(value: number): string {
  return new Intl.NumberFormat(i18n.language, { notation: 'compact', maximumFractionDigits: 1 }).format(
    value,
  )
}

export function formatImpactCountFull(value: number): string {
  return new Intl.NumberFormat(i18n.language).format(value)
}

export function formatShare(value: number): string {
  return new Intl.NumberFormat(i18n.language, {
    style: 'percent',
    maximumFractionDigits: 0,
  }).format(value)
}

export async function fetchImpactPulseDashboard(options?: {
  signal?: AbortSignal
}): Promise<ImpactPulseDashboard> {
  const client = requireSupabase()
  const { data, error } = await withAutoRetry(
    async () => {
      const result = await client.rpc('get_youth_impact_pulse_dashboard')
      if (options?.signal?.aborted) throw new DOMException('Aborted', 'AbortError')
      return result
    },
    { signal: options?.signal },
  )

  if (error) throw enhanceSupabaseError(error)
  return parseDashboard(data)
}

export function isRpcMissing(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return (
    message.includes('get_youth_impact_pulse_dashboard') ||
    message.includes('Could not find the function') ||
    message.includes('PGRST202')
  )
}
