import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

const DEFAULT_DEBOUNCE_MS = 200

/**
 * Refetch when the user navigates back to a matching route without a full remount.
 * Skips the first render so mount-time loaders are not duplicated.
 */
export function useRouteFocusRefetch(
  refetch: () => void,
  options: {
    pathPrefixes: string[]
    enabled?: boolean
    debounceMs?: number
  },
): void {
  const location = useLocation()
  const refetchRef = useRef(refetch)
  const skipFirstRef = useRef(true)
  const lastKeyRef = useRef<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const enabled = options.enabled ?? true
  const debounceMs = options.debounceMs ?? DEFAULT_DEBOUNCE_MS
  const pathPrefixes = options.pathPrefixes

  useEffect(() => {
    refetchRef.current = refetch
  }, [refetch])

  useEffect(() => {
    if (!enabled) return

    const onRoute = pathPrefixes.some(
      (prefix) =>
        location.pathname === prefix || location.pathname.startsWith(`${prefix}/`),
    )
    if (!onRoute) return

    if (skipFirstRef.current) {
      skipFirstRef.current = false
      lastKeyRef.current = location.key
      return
    }

    if (lastKeyRef.current === location.key) return
    lastKeyRef.current = location.key

    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null
      refetchRef.current()
    }, debounceMs)

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [location.key, location.pathname, enabled, debounceMs, pathPrefixes])
}
