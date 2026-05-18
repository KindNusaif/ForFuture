import type { Session, User } from '@supabase/supabase-js'
import {
  PROFILE_COLUMNS,
  PROFILE_COLUMNS_LEGACY,
  PROFILE_COLUMNS_MINIMAL,
  PROFILE_COLUMNS_ONBOARDING,
  PROFILE_COLUMNS_WITH_APPEARANCE,
} from './profileColumns'
import { enhanceSupabaseError, isMissingColumn, isPostgrestError } from './supabaseErrors'
import { requireSupabase } from './supabase'
import { DEFAULT_REQUEST_TIMEOUT_MS, withTimeout } from './supabaseRequest'
import { getAppOrigin, getPasswordResetRedirectUrl } from './appUrl'
import { generateYouthVoiceIdCandidate } from './youthVoiceId'
import { isAppearanceMode } from './theme/types'
import type { Profile } from '../types'

function mapProfile(row: Record<string, unknown>): Profile {
  return {
    id: row.id as string,
    display_name: row.display_name as string,
    youth_voice_id: String(row.youth_voice_id ?? ''),
    bio: (row.bio as string | null) ?? null,
    avatar_url: (row.avatar_url as string | null) ?? null,
    created_at: row.created_at as string,
    is_verified_organizer: Boolean(
      row.is_verified_organizer ?? row.is_verified_organization,
    ),
    organizer_verification_type:
      (row.organizer_verification_type as Profile['organizer_verification_type']) ??
      (row.organization_verification_type === 'official_organization'
        ? 'organization'
        : (row.organization_verification_type as Profile['organizer_verification_type'])) ??
      null,
    organizer_verified_at:
      (row.organizer_verified_at as string | null) ??
      (row.verified_at as string | null) ??
      null,
    is_verified_organization: Boolean(
      row.is_verified_organizer ?? row.is_verified_organization,
    ),
    organization_verification_type:
      (row.organization_verification_type as Profile['organization_verification_type']) ?? null,
    verified_at:
      (row.organizer_verified_at as string | null) ??
      (row.verified_at as string | null) ??
      null,
    is_admin: Boolean(row.is_admin),
    appearance_mode: isAppearanceMode(row.appearance_mode) ? row.appearance_mode : undefined,
    visual_comfort_enabled:
      row.visual_comfort_enabled == null ? undefined : Boolean(row.visual_comfort_enabled),
    reduce_motion_enabled:
      row.reduce_motion_enabled == null ? undefined : Boolean(row.reduce_motion_enabled),
    onboarding_completed_at: (row.onboarding_completed_at as string | null) ?? null,
    onboarding_skipped_at: (row.onboarding_skipped_at as string | null) ?? null,
    preferred_causes: Array.isArray(row.preferred_causes)
      ? (row.preferred_causes as string[])
      : undefined,
    participation_preferences: Array.isArray(row.participation_preferences)
      ? (row.participation_preferences as string[])
      : undefined,
  }
}

export async function getSession(): Promise<Session | null> {
  const client = requireSupabase()
  const { data, error } = await withTimeout(client.auth.getSession(), DEFAULT_REQUEST_TIMEOUT_MS)
  if (error) throw error
  return data.session
}

export interface SignUpResult {
  user: User
  /** True when Supabase requires email confirmation before a session exists. */
  needsEmailConfirmation: boolean
}

const PROFILE_INSERT_SELECT_SETS = [
  PROFILE_COLUMNS_MINIMAL,
  PROFILE_COLUMNS_LEGACY,
  PROFILE_COLUMNS,
  PROFILE_COLUMNS_ONBOARDING,
  PROFILE_COLUMNS_WITH_APPEARANCE,
] as const

/** Create profile row after auth — retries on Youth Voice ID collision. */
async function insertProfileForUser(userId: string, displayName: string): Promise<Profile> {
  const existing = await getProfile(userId)
  if (existing) return existing

  const client = requireSupabase()
  const trimmedName = displayName.trim()

  for (let attempt = 0; attempt < 8; attempt++) {
    const insertRow: Record<string, unknown> = {
      id: userId,
      display_name: trimmedName,
      youth_voice_id: generateYouthVoiceIdCandidate(),
    }

    let lastError: unknown = null

    for (const columns of PROFILE_INSERT_SELECT_SETS) {
      const { data, error } = await withTimeout(
        client.from('profiles').insert(insertRow).select(columns).single(),
        DEFAULT_REQUEST_TIMEOUT_MS,
      )

      if (!error && data) {
        const profile = mapProfile(data as unknown as Record<string, unknown>)
        if (!profile.youth_voice_id) {
          try {
            return await ensureYouthVoiceId(userId)
          } catch {
            return profile
          }
        }
        return profile
      }

      lastError = error
      if (!error) continue

      if (error.code === '23505') {
        const again = await getProfile(userId)
        if (again) return again
        break
      }

      if (isMissingColumn(error)) continue

      if (error.code === '42501') {
        throw new Error(
          'Your account was created. Please confirm your email (if required), then log in to finish setup.',
        )
      }

      throw enhanceSupabaseError(error)
    }

    if (isPostgrestError(lastError) && lastError.code === '23505') {
      continue
    }

    if (lastError) throw enhanceSupabaseError(lastError)
  }

  throw new Error(
    'Your account may have been created. Please try logging in. If that does not work, contact support.',
  )
}

export async function signUp(
  email: string,
  password: string,
  displayName: string,
): Promise<SignUpResult> {
  const client = requireSupabase()

  const { data, error } = await withTimeout(
    client.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { display_name: displayName.trim() },
        emailRedirectTo: `${getAppOrigin()}/login`,
      },
    }),
    DEFAULT_REQUEST_TIMEOUT_MS,
  )

  if (error) throw error
  if (!data.user) throw new Error('Sign up failed. Please try again.')

  if (Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    throw new Error('An account with this email already exists. Try logging in instead.')
  }

  const needsEmailConfirmation = !data.session

  if (data.session) {
    try {
      await insertProfileForUser(data.user.id, displayName)
    } catch (profileErr) {
      if (profileErr instanceof Error) throw profileErr
      throw new Error(
        'Your account was created. Please log in to complete setup.',
      )
    }
  }

  return { user: data.user, needsEmailConfirmation }
}

export async function signIn(email: string, password: string): Promise<User> {
  const client = requireSupabase()
  const { data, error } = await withTimeout(
    client.auth.signInWithPassword({
      email: email.trim(),
      password,
    }),
    DEFAULT_REQUEST_TIMEOUT_MS,
  )
  if (error) throw error
  if (!data.user) throw new Error('Login failed. Please try again.')
  return data.user
}

export async function signOut(): Promise<void> {
  const client = requireSupabase()
  const { error } = await client.auth.signOut()
  if (error) throw error
}

/** Send password reset email (always resolve; caller shows privacy-safe copy). */
export async function requestPasswordReset(email: string): Promise<void> {
  const client = requireSupabase()
  const { error } = await withTimeout(
    client.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: getPasswordResetRedirectUrl(),
    }),
    DEFAULT_REQUEST_TIMEOUT_MS,
  )
  if (error) throw error
}

/** Set a new password during an active recovery session. */
export async function updatePassword(newPassword: string): Promise<void> {
  const client = requireSupabase()
  const { error } = await withTimeout(
    client.auth.updateUser({ password: newPassword }),
    DEFAULT_REQUEST_TIMEOUT_MS,
  )
  if (error) throw error
}

export function parseAuthHashType(): string | null {
  if (typeof window === 'undefined') return null
  const hash = window.location.hash.replace(/^#/, '')
  if (!hash) return null
  return new URLSearchParams(hash).get('type')
}

export function clearAuthHashFromUrl(): void {
  if (typeof window === 'undefined') return
  const path = window.location.pathname + window.location.search
  window.history.replaceState(null, '', path)
}

export async function ensureYouthVoiceId(userId: string): Promise<Profile> {
  const client = requireSupabase()
  const existing = await getProfile(userId)
  if (!existing) throw new Error('Profile not found.')
  if (existing.youth_voice_id) return existing

  for (let attempt = 0; attempt < 8; attempt++) {
    const youthVoiceId = generateYouthVoiceIdCandidate()
    const { data, error } = await withTimeout(
      client
        .from('profiles')
        .update({ youth_voice_id: youthVoiceId })
        .eq('id', userId)
        .select(PROFILE_COLUMNS)
        .single(),
      DEFAULT_REQUEST_TIMEOUT_MS,
    )

    if (!error) return mapProfile(data as unknown as Record<string, unknown>)
    if (error.code === '23505') continue
    throw enhanceSupabaseError(error)
  }

  throw new Error('Could not assign a Youth Voice ID. Please try again.')
}

async function selectProfileRow(userId: string): Promise<Record<string, unknown> | null> {
  const client = requireSupabase()
  const columnSets = [
    PROFILE_COLUMNS_WITH_APPEARANCE,
    PROFILE_COLUMNS_ONBOARDING,
    PROFILE_COLUMNS,
    PROFILE_COLUMNS_LEGACY,
    PROFILE_COLUMNS_MINIMAL,
  ]

  let lastError: unknown = null

  for (const columns of columnSets) {
    const { data, error } = await withTimeout(
      client.from('profiles').select(columns).eq('id', userId).maybeSingle(),
      DEFAULT_REQUEST_TIMEOUT_MS,
    )
    if (!error) return data as Record<string, unknown> | null
    lastError = error
    if (!isMissingColumn(error)) throw enhanceSupabaseError(error)
  }

  throw enhanceSupabaseError(lastError)
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const data = await selectProfileRow(userId)
  if (!data) return null

  const profile = mapProfile(data as unknown as Record<string, unknown>)
  if (!profile.youth_voice_id) {
    try {
      return await ensureYouthVoiceId(userId)
    } catch (err) {
      if (isMissingColumn(err)) throw enhanceSupabaseError(err)
      throw err
    }
  }

  return profile
}

export async function ensureProfile(userId: string, displayName: string): Promise<Profile> {
  return insertProfileForUser(userId, displayName)
}

export async function updateProfileBio(userId: string, bio: string): Promise<Profile> {
  const client = requireSupabase()
  const { data, error } = await withTimeout(
    client
      .from('profiles')
      .update({ bio: bio.trim() || null })
      .eq('id', userId)
      .select(PROFILE_COLUMNS)
      .single(),
    DEFAULT_REQUEST_TIMEOUT_MS,
  )

  if (error) throw enhanceSupabaseError(error)
  return mapProfile(data as unknown as Record<string, unknown>)
}
