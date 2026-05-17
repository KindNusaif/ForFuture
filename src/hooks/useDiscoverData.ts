import { useCallback } from 'react'
import { useAsyncLoad } from './useAsyncLoad'
import { EMPTY_DISCOVER_PAGE, fetchDiscoverPageDataSafe } from '../lib/discover'

export function useDiscoverData() {
  const execute = useCallback(
    (signal: AbortSignal) => fetchDiscoverPageDataSafe({ signal }),
    [],
  )

  const { data, isLoading, error, reload } = useAsyncLoad(execute)

  return {
    data: data ?? EMPTY_DISCOVER_PAGE,
    loading: isLoading && !data,
    error,
    reload,
  }
}
