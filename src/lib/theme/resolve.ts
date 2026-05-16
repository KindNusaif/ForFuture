import type { AppearanceMode, ResolvedTheme, ThemePreferences } from './types'

export function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function resolveTheme(mode: AppearanceMode): ResolvedTheme {
  if (mode === 'system') return getSystemTheme()
  return mode
}

export function osPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function shouldReduceMotion(prefs: ThemePreferences): boolean {
  return prefs.reduceMotion || osPrefersReducedMotion()
}
