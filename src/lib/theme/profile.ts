import { requireSupabase } from '../supabase'
import { isMissingColumn } from '../supabaseErrors'
import { DEFAULT_REQUEST_TIMEOUT_MS, withTimeout } from '../supabaseRequest'
import type { ThemePreferences } from './types'
import { isAppearanceMode } from './types'

export interface ProfileAppearanceFields {
  appearance_mode?: string | null
  visual_comfort_enabled?: boolean | null
  reduce_motion_enabled?: boolean | null
}

export function profileToThemePreferences(
  row: ProfileAppearanceFields | null | undefined,
): Partial<ThemePreferences> | null {
  if (!row) return null
  if (row.appearance_mode == null && row.visual_comfort_enabled == null && row.reduce_motion_enabled == null) {
    return null
  }
  return {
    appearanceMode: isAppearanceMode(row.appearance_mode) ? row.appearance_mode : undefined,
    visualComfort:
      row.visual_comfort_enabled == null ? undefined : Boolean(row.visual_comfort_enabled),
    reduceMotion:
      row.reduce_motion_enabled == null ? undefined : Boolean(row.reduce_motion_enabled),
  }
}

export async function saveAppearanceToProfile(
  userId: string,
  prefs: ThemePreferences,
): Promise<void> {
  const client = requireSupabase()
  const { error } = await withTimeout(
    client
      .from('profiles')
      .update({
        appearance_mode: prefs.appearanceMode,
        visual_comfort_enabled: prefs.visualComfort,
        reduce_motion_enabled: prefs.reduceMotion,
      })
      .eq('id', userId),
    DEFAULT_REQUEST_TIMEOUT_MS,
  )

  if (error && !isMissingColumn(error)) {
    throw error
  }
}
