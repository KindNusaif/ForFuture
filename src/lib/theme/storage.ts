import {
  DEFAULT_THEME_PREFERENCES,
  parseThemePreferences,
  THEME_STORAGE_KEY,
  type ThemePreferences,
} from './types'

export function readStoredThemePreferences(): ThemePreferences {
  if (typeof window === 'undefined') return { ...DEFAULT_THEME_PREFERENCES }
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY)
    if (!raw) return { ...DEFAULT_THEME_PREFERENCES }
    return parseThemePreferences(JSON.parse(raw))
  } catch {
    return { ...DEFAULT_THEME_PREFERENCES }
  }
}

export function writeStoredThemePreferences(prefs: ThemePreferences): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(prefs))
}
