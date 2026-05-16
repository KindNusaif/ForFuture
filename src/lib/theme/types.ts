export type AppearanceMode = 'light' | 'dark' | 'system'

export type ResolvedTheme = 'light' | 'dark'

export interface ThemePreferences {
  appearanceMode: AppearanceMode
  visualComfort: boolean
  reduceMotion: boolean
}

export const THEME_STORAGE_KEY = 'forfuture-appearance-v1'

export const DEFAULT_THEME_PREFERENCES: ThemePreferences = {
  appearanceMode: 'system',
  visualComfort: false,
  reduceMotion: false,
}

export const APPEARANCE_MODES: AppearanceMode[] = ['light', 'dark', 'system']

export function isAppearanceMode(value: unknown): value is AppearanceMode {
  return value === 'light' || value === 'dark' || value === 'system'
}

export function parseThemePreferences(raw: unknown): ThemePreferences {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_THEME_PREFERENCES }
  const o = raw as Record<string, unknown>
  return {
    appearanceMode: isAppearanceMode(o.appearanceMode) ? o.appearanceMode : 'system',
    visualComfort: Boolean(o.visualComfort),
    reduceMotion: Boolean(o.reduceMotion),
  }
}
