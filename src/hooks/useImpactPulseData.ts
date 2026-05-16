import { useCallback, useEffect, useRef, useState } from 'react'
import {
  EMPTY_IMPACT_PULSE,
  fetchImpactPulseDashboard,
  isRpcMissing,
  type ImpactPulseDashboard,
} from '../lib/impactPulse'
import { formatError } from '../lib/errors'
import { isRequestAborted } from '../lib/supabaseRequest'

export function useImpactPulseData() {
  const [data, setData] = useState<ImpactPulseDashboard>(EMPTY_IMPACT_PULSE)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [needsMigration, setNeedsMigration] = useState(false)
  const requestIdRef = useRef(0)
  const abortRef = useRef<AbortController | null>(null)

  const reload = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const requestId = ++requestIdRef.current
    setLoading(true)
    setError(null)
    setNeedsMigration(false)

    try {
      const dashboard = await fetchImpactPulseDashboard({ signal: controller.signal })
      if (requestId !== requestIdRef.current || controller.signal.aborted) return
      setData(dashboard)
    } catch (err) {
      if (requestId !== requestIdRef.current || isRequestAborted(err)) return
      if (isRpcMissing(err)) {
        setNeedsMigration(true)
        setData(EMPTY_IMPACT_PULSE)
      } else {
        setError(formatError(err))
      }
    } finally {
      if (requestId === requestIdRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void reload()
    }, 0)
    return () => {
      window.clearTimeout(timer)
      abortRef.current?.abort()
    }
  }, [reload])

  return { data, loading, error, needsMigration, reload }
}
