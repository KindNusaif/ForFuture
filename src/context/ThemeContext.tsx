import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { applyThemeToDocument } from '../lib/theme/apply'
import { profileToThemePreferences, saveAppearanceToProfile } from '../lib/theme/profile'
import { resolveTheme } from '../lib/theme/resolve'
import { readStoredThemePreferences, writeStoredThemePreferences } from '../lib/theme/storage'
import {
  APPEARANCE_MODES,
  type AppearanceMode,
  type ThemePreferences,
} from '../lib/theme/types'
import { useAuth } from '../hooks/useAuth'
import { ThemeContext, type ThemeContextValue } from './theme-context'

function mergePreferences(
  base: ThemePreferences,
  patch: Partial<ThemePreferences> | null | undefined,
): ThemePreferences {
  if (!patch) return base
  return {
    appearanceMode: patch.appearanceMode ?? base.appearanceMode,
    visualComfort: patch.visualComfort ?? base.visualComfort,
    reduceMotion: patch.reduceMotion ?? base.reduceMotion,
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth()
  const [preferences, setPreferences] = useState<ThemePreferences>(() =>
    readStoredThemePreferences(),
  )
  const hydratedFromProfile = useRef(false)
  const saveTimerRef = useRef<number | null>(null)

  const resolvedTheme = useMemo(
    () => resolveTheme(preferences.appearanceMode),
    [preferences.appearanceMode],
  )

  const persist = useCallback(
    (next: ThemePreferences) => {
      writeStoredThemePreferences(next)
      applyThemeToDocument(next)

      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current)
      }

      saveTimerRef.current = window.setTimeout(() => {
        if (user?.id) {
          void saveAppearanceToProfile(user.id, next).catch(() => {
            /* local cache remains source of truth until profile columns exist */
          })
        }
      }, 400)
    },
    [user],
  )

  const updatePreferences = useCallback(
    (patch: Partial<ThemePreferences>) => {
      setPreferences((prev) => {
        const next = { ...prev, ...patch }
        persist(next)
        return next
      })
    },
    [persist],
  )

  useEffect(() => {
    applyThemeToDocument(preferences)
  }, [preferences])

  useEffect(() => {
    if (!user) {
      hydratedFromProfile.current = false
    }
  }, [user])

  useEffect(() => {
    if (!profile || hydratedFromProfile.current) return

    const fromProfile = profileToThemePreferences(profile)
    if (!fromProfile) {
      hydratedFromProfile.current = true
      return
    }

    const timer = window.setTimeout(() => {
      setPreferences((prev) => {
        const next = mergePreferences(prev, fromProfile)
        writeStoredThemePreferences(next)
        applyThemeToDocument(next)
        return next
      })
      hydratedFromProfile.current = true
    }, 0)

    return () => window.clearTimeout(timer)
  }, [profile])

  useEffect(() => {
    if (preferences.appearanceMode !== 'system') return

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      applyThemeToDocument(preferences)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [preferences])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => {
      applyThemeToDocument(preferences)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [preferences])

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current)
    }
  }, [])

  const setAppearanceMode = useCallback(
    (mode: AppearanceMode) => updatePreferences({ appearanceMode: mode }),
    [updatePreferences],
  )

  const setVisualComfort = useCallback(
    (enabled: boolean) => updatePreferences({ visualComfort: enabled }),
    [updatePreferences],
  )

  const setReduceMotion = useCallback(
    (enabled: boolean) => updatePreferences({ reduceMotion: enabled }),
    [updatePreferences],
  )

  const cycleAppearanceMode = useCallback(() => {
    setPreferences((prev) => {
      const idx = APPEARANCE_MODES.indexOf(prev.appearanceMode)
      const nextMode = APPEARANCE_MODES[(idx + 1) % APPEARANCE_MODES.length]
      const next = { ...prev, appearanceMode: nextMode }
      persist(next)
      return next
    })
  }, [persist])

  const value = useMemo<ThemeContextValue>(
    () => ({
      preferences,
      resolvedTheme,
      setAppearanceMode,
      setVisualComfort,
      setReduceMotion,
      cycleAppearanceMode,
    }),
    [
      preferences,
      resolvedTheme,
      setAppearanceMode,
      setVisualComfort,
      setReduceMotion,
      cycleAppearanceMode,
    ],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
