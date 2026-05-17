import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchDiscoverPageData, type DiscoverPageData } from '../lib/discover'
import { EMPTY_IMPACT_PULSE } from '../lib/impactPulse'
import { formatError } from '../lib/errors'
import { isRequestAborted } from '../lib/supabaseRequest'

const EMPTY_DATA: DiscoverPageData = {
  impact: EMPTY_IMPACT_PULSE,
  trending: [],
  categoryCounts: [],
  featured: { volunteer: [], civic: [], rising: [] },
}

export function useDiscoverData() {
  const [data, setData] = useState<DiscoverPageData>(EMPTY_DATA)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const requestIdRef = useRef(0)

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current
    const controller = new AbortController()
    setLoading(true)
    setError(null)

    try {
      const result = await fetchDiscoverPageData({ signal: controller.signal })
      if (requestId !== requestIdRef.current) return
      setData(result)
    } catch (err) {
      if (isRequestAborted(err)) return
      if (requestId !== requestIdRef.current) return
      setError(formatError(err))
      setData(EMPTY_DATA)
    } finally {
      if (requestId === requestIdRef.current) setLoading(false)
    }

    return () => controller.abort()
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return { data, loading, error, reload: load }
}
