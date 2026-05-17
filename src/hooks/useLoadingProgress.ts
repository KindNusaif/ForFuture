import { useEffect, useState } from 'react'
import {
  LOADING_RECOVERY_HINT_MS,
  LOADING_SLOW_HINT_MS,
} from '../lib/requestConfig'

/** Staged slow / recovery hints while `isActive` is true. */
export function useLoadingProgress(isActive: boolean) {
  const [slowHint, setSlowHint] = useState(false)
  const [recovery, setRecovery] = useState(false)

  useEffect(() => {
    if (!isActive) return

    const slowTimer = window.setTimeout(() => setSlowHint(true), LOADING_SLOW_HINT_MS)
    const recoverTimer = window.setTimeout(() => setRecovery(true), LOADING_RECOVERY_HINT_MS)

    return () => {
      window.clearTimeout(slowTimer)
      window.clearTimeout(recoverTimer)
      setSlowHint(false)
      setRecovery(false)
    }
  }, [isActive])

  return {
    showSlowHint: isActive && slowHint,
    showRecovery: isActive && recovery,
  }
}
