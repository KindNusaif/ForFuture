import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  fetchImpactMapEntries,
  filterImpactMapEntries,
  getMappableEntries,
  getUniqueDistricts,
  type ImpactContentFilter,
  type ImpactDateFilter,
  type ImpactMapClientFilters,
  type ImpactMapEntry,
  type ImpactStatusFilter,
} from '../lib/impactMap'
import { DEFAULT_NEAR_RADIUS_KM } from '../lib/mapConfig'
import { formatError } from '../lib/errors'
import type { GeoPosition } from './useGeolocation'

export function useImpactMapData(userLocation: GeoPosition | null) {
  const [allEntries, setAllEntries] = useState<ImpactMapEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [contentType, setContentType] = useState<ImpactContentFilter>('all')
  const [district, setDistrict] = useState('')
  const [status, setStatus] = useState<ImpactStatusFilter>('all')
  const [dateFilter, setDateFilter] = useState<ImpactDateFilter>('all')
  const [nearMeEnabled, setNearMeEnabled] = useState(false)
  const [nearRadiusKm, setNearRadiusKm] = useState(DEFAULT_NEAR_RADIUS_KM)
  const [search, setSearch] = useState('')

  const requestIdRef = useRef(0)

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current
    setLoading(true)
    setError(null)

    try {
      const data = await fetchImpactMapEntries({
        layerType: contentType !== 'all' ? contentType : undefined,
      })
      if (requestId !== requestIdRef.current) return
      setAllEntries(data)
    } catch (err) {
      if (requestId !== requestIdRef.current) return
      setError(formatError(err))
      setAllEntries([])
    } finally {
      if (requestId === requestIdRef.current) setLoading(false)
    }
  }, [contentType])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [load])

  const clientFilters: ImpactMapClientFilters = useMemo(
    () => ({
      contentType,
      district,
      status,
      dateFilter,
      nearMeEnabled,
      nearRadiusKm,
      userLocation,
      search,
    }),
    [
      contentType,
      district,
      status,
      dateFilter,
      nearMeEnabled,
      nearRadiusKm,
      userLocation,
      search,
    ],
  )

  const filtered = useMemo(
    () => filterImpactMapEntries(allEntries, clientFilters),
    [allEntries, clientFilters],
  )

  const mappable = useMemo(() => getMappableEntries(filtered), [filtered])

  const districts = useMemo(() => getUniqueDistricts(allEntries), [allEntries])

  const stats = useMemo(
    () => ({
      volunteer: allEntries.filter((e) => e.layerType === 'volunteer').length,
      civic: allEntries.filter((e) => e.layerType === 'civic_action').length,
      issues: allEntries.filter((e) => e.layerType === 'issue').length,
    }),
    [allEntries],
  )

  return {
    loading,
    error,
    filtered,
    mappable,
    districts,
    stats,
    reload: load,
    filters: {
      contentType,
      setContentType,
      district,
      setDistrict,
      status,
      setStatus,
      dateFilter,
      setDateFilter,
      nearMeEnabled,
      setNearMeEnabled,
      nearRadiusKm,
      setNearRadiusKm,
      search,
      setSearch,
    },
  }
}
