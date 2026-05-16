import { resolveTheme, shouldReduceMotion } from './resolve'
import type { ThemePreferences } from './types'

export function applyThemeToDocument(prefs: ThemePreferences): void {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  const resolved = resolveTheme(prefs.appearanceMode)

  root.setAttribute('data-appearance-mode', prefs.appearanceMode)
  root.setAttribute('data-theme', resolved)
  root.setAttribute('data-comfort', prefs.visualComfort ? 'true' : 'false')
  root.setAttribute(
    'data-reduce-motion',
    shouldReduceMotion(prefs) ? 'true' : 'false',
  )
  root.style.colorScheme = resolved
}
