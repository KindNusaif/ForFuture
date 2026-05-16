import { createContext } from 'react'
import type { AppearanceMode, ThemePreferences } from '../lib/theme/types'

export interface ThemeContextValue {
  preferences: ThemePreferences
  resolvedTheme: 'light' | 'dark'
  setAppearanceMode: (mode: AppearanceMode) => void
  setVisualComfort: (enabled: boolean) => void
  setReduceMotion: (enabled: boolean) => void
  cycleAppearanceMode: () => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)
