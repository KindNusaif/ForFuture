import type { Category } from '../types'
import { enhanceSupabaseError, isMissingColumn } from './supabaseErrors'
import { requireSupabase } from './supabase'
import { DEFAULT_REQUEST_TIMEOUT_MS, withTimeout } from './supabaseRequest'
import type { Profile } from '../types'

export const ONBOARDING_CAUSES = [
  { id: 'education', label: 'Education', category: 'Education' as Category },
  { id: 'environment', label: 'Environment', category: 'Environment' as Category },
  { id: 'health', label: 'Health', category: 'Health' as Category },
  { id: 'community_safety', label: 'Community Safety', category: 'Community' as Category },
  { id: 'relief', label: 'Relief', category: 'Community' as Category, reliefOnly: true },
  { id: 'youth_rights', label: 'Youth Rights', category: 'Justice' as Category },
] as const

export type OnboardingCauseId = (typeof ONBOARDING_CAUSES)[number]['id']

export const PARTICIPATION_OPTIONS = [
  {
    id: 'support',
    label: 'Support Movements',
    description: 'Back ideas and campaigns that align with your values.',
  },
  {
    id: 'volunteer',
    label: 'Volunteer',
    description: 'Join drives and show up for community action.',
  },
  {
    id: 'petition',
    label: 'Sign Petitions',
    description: 'Add your voice to calls for change.',
  },
  {
    id: 'raise',
    label: 'Raise Issues',
    description: 'Start movements about issues you care about.',
  },
] as const

export type ParticipationPreferenceId = (typeof PARTICIPATION_OPTIONS)[number]['id']

const ONBOARDING_COLUMNS =
  'id, display_name, youth_voice_id, onboarding_completed_at, onboarding_skipped_at, preferred_causes, participation_preferences'

export function isOnboardingComplete(profile: Profile | null | undefined): boolean {
  if (!profile) return false
  return Boolean(profile.onboarding_completed_at || profile.onboarding_skipped_at)
}

export function categoriesFromCauseIds(causeIds: string[]): Category[] {
  const cats = new Set<Category>()
  for (const id of causeIds) {
    const opt = ONBOARDING_CAUSES.find((c) => c.id === id)
    if (opt) cats.add(opt.category)
  }
  return [...cats]
}

export async function saveOnboardingPreferences(
  userId: string,
  causes: string[],
  preferences: string[],
  options: { skipped?: boolean } = {},
): Promise<void> {
  const client = requireSupabase()
  const now = new Date().toISOString()
  const row: Record<string, unknown> = {
    preferred_causes: causes,
    participation_preferences: preferences,
  }
  if (options.skipped) {
    row.onboarding_skipped_at = now
    row.onboarding_completed_at = now
  } else {
    row.onboarding_completed_at = now
    row.onboarding_skipped_at = null
  }

  const { error } = await withTimeout(
    client.from('profiles').update(row).eq('id', userId),
    DEFAULT_REQUEST_TIMEOUT_MS,
  )
  if (error) {
    if (isMissingColumn(error)) {
      throw new Error(
        'Onboarding is not available yet. Run supabase/onboarding_and_notifications.sql in Supabase.',
      )
    }
    throw enhanceSupabaseError(error)
  }
}

export async function fetchOnboardingProfileFields(userId: string): Promise<{
  onboarding_completed_at: string | null
  onboarding_skipped_at: string | null
  preferred_causes: string[]
  participation_preferences: string[]
} | null> {
  const client = requireSupabase()
  const { data, error } = await withTimeout(
    client.from('profiles').select(ONBOARDING_COLUMNS).eq('id', userId).maybeSingle(),
    DEFAULT_REQUEST_TIMEOUT_MS,
  )
  if (error) {
    if (isMissingColumn(error)) return null
    throw enhanceSupabaseError(error)
  }
  if (!data) return null
  const row = data as Record<string, unknown>
  return {
    onboarding_completed_at: (row.onboarding_completed_at as string | null) ?? null,
    onboarding_skipped_at: (row.onboarding_skipped_at as string | null) ?? null,
    preferred_causes: Array.isArray(row.preferred_causes)
      ? (row.preferred_causes as string[])
      : [],
    participation_preferences: Array.isArray(row.participation_preferences)
      ? (row.participation_preferences as string[])
      : [],
  }
}
