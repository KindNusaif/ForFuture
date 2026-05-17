import { useCallback } from 'react'
import { useAsyncLoad } from './useAsyncLoad'
import { fetchDiscoverPageData, type DiscoverPageData } from '../lib/discover'
import { EMPTY_IMPACT_PULSE } from '../lib/impactPulse'

const EMPTY_DATA: DiscoverPageData = {
  impact: EMPTY_IMPACT_PULSE,
  trending: [],
  categoryCounts: [],
  featured: { volunteer: [], civic: [], rising: [] },
}

export function useDiscoverData() {
  const execute = useCallback(
    (signal: AbortSignal) => fetchDiscoverPageData({ signal }),
    [],
  )

  const { data, isLoading, error, reload } = useAsyncLoad(execute)

  return {
    data: data ?? EMPTY_DATA,
    loading: isLoading && !data,
    error,
    reload,
  }
}
