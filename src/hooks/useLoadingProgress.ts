import { useEffect, useState } from 'react'
import {
  LOADING_RECOVERY_HINT_MS,
  LOADING_SLOW_HINT_MS,
} from '../lib/requestConfig'

/** Staged slow / recovery hints while `isActive` is true. */
export function useLoadingProgress(isActive: boolean) {
  const [showSlowHint, setShowSlowHint] = useState(false)
  const [showRecovery, setShowRecovery] = useState(false)

  useEffect(() => {
    if (!isActive) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset hints when load completes
      setShowSlowHint(false)
      setShowRecovery(false)
      return
    }

    const slowTimer = window.setTimeout(() => setShowSlowHint(true), LOADING_SLOW_HINT_MS)
    const recoverTimer = window.setTimeout(() => setShowRecovery(true), LOADING_RECOVERY_HINT_MS)

    return () => {
      window.clearTimeout(slowTimer)
      window.clearTimeout(recoverTimer)
      setShowSlowHint(false)
      setShowRecovery(false)
    }
  }, [isActive])

  return { showSlowHint, showRecovery }
}
