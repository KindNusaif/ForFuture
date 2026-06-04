import { useEffect, useRef } from 'react'

const DEFAULT_DEBOUNCE_MS = 800

/** Refetch when the tab becomes visible or the network reconnects (debounced). */
export function useVisibilityRefetch(
  refetch: () => void,
  options?: { enabled?: boolean; debounceMs?: number },
): void {
  const enabled = options?.enabled ?? true
  const debounceMs = options?.debounceMs ?? DEFAULT_DEBOUNCE_MS
  const refetchRef = useRef(refetch)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    refetchRef.current = refetch
  }, [refetch])

  useEffect(() => {
    if (!enabled) return

    const schedule = () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(() => {
        refetchRef.current()
      }, debounceMs)
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') schedule()
    }

    window.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('online', schedule)

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
      window.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('online', schedule)
    }
  }, [enabled, debounceMs])
}
