import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Map } from 'lucide-react'
import ImpactMapCanvas from '../components/impact-map/ImpactMapCanvas'
import ImpactMapDetail from '../components/impact-map/ImpactMapDetail'
import ImpactMapFilters from '../components/impact-map/ImpactMapFilters'
import ImpactMapList from '../components/impact-map/ImpactMapList'
import ImpactMapStats from '../components/impact-map/ImpactMapStats'
import EmptyState from '../components/EmptyState'
import AsyncLoadHint from '../components/AsyncLoadHint'
import { useLoadingProgress } from '../hooks/useLoadingProgress'
import { PostCardSkeleton } from '../components/Skeleton'
import { useGeolocation } from '../hooks/useGeolocation'
import { useImpactMapData } from '../hooks/useImpactMapData'
import { useAuth } from '../hooks/useAuth'
import { FOCUSED_MAP_ZOOM, USER_LOCATION_ZOOM } from '../lib/mapConfig'
import type { ImpactMapEntry } from '../lib/impactMap'

export default function ImpactMapPage() {
  const { isMember } = useAuth()
  const geo = useGeolocation()
  const {
    loading,
    error,
    filtered,
    mappable,
    districts,
    stats,
    reload,
    filters,
  } = useImpactMapData(geo.position)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mobileListOpen, setMobileListOpen] = useState(true)
  const { showSlowHint, showRecovery } = useLoadingProgress(loading)
  const [selectionFlyTo, setSelectionFlyTo] = useState<{
    lat: number
    lng: number
    zoom?: number
  } | null>(null)

  const selectedEntry = useMemo(
    () => filtered.find((e) => e.id === selectedId) ?? null,
    [filtered, selectedId],
  )

  const detailBase = isMember ? '/feed' : '/movements'

  const flyTo = useMemo(() => {
    if (selectionFlyTo) return selectionFlyTo
    if (geo.position && filters.nearMeEnabled) {
      return { lat: geo.position.lat, lng: geo.position.lng, zoom: USER_LOCATION_ZOOM }
    }
    return null
  }, [selectionFlyTo, geo.position, filters.nearMeEnabled])

  function handleSelectEntry(entry: ImpactMapEntry) {
    setSelectedId(entry.id)
    if (entry.latitude != null && entry.longitude != null) {
      setSelectionFlyTo({
        lat: entry.latitude,
        lng: entry.longitude,
        zoom: FOCUSED_MAP_ZOOM,
      })
    }
  }

  function handleUseMyLocation() {
    geo.requestLocation()
    filters.setNearMeEnabled(true)
    setSelectionFlyTo(null)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
      <header className="mb-6">
        <p className="eyebrow flex items-center gap-2">
          <Map className="h-4 w-4" aria-hidden />
          ForFuture
        </p>
        <h1 className="page-title mt-2">Impact Map</h1>
        <p className="mt-2 max-w-2xl text-secondary">
          Discover volunteer opportunities, civic actions, and community issues happening across
          the country.
        </p>
      </header>

      {!loading && !error && (
        <ImpactMapStats
          volunteer={stats.volunteer}
          civic={stats.civic}
          issues={stats.issues}
          visibleCount={filtered.length}
        />
      )}

      <div className="mt-6">
        <ImpactMapFilters
          contentType={filters.contentType}
          onContentTypeChange={filters.setContentType}
          district={filters.district}
          onDistrictChange={filters.setDistrict}
          districts={districts}
          status={filters.status}
          onStatusChange={filters.setStatus}
          dateFilter={filters.dateFilter}
          onDateFilterChange={filters.setDateFilter}
          nearMeEnabled={filters.nearMeEnabled}
          onNearMeEnabledChange={filters.setNearMeEnabled}
          nearRadiusKm={filters.nearRadiusKm}
          onNearRadiusKmChange={filters.setNearRadiusKm}
          search={filters.search}
          onSearchChange={filters.setSearch}
          onUseMyLocation={handleUseMyLocation}
          geoLoading={geo.loading}
          geoError={geo.error}
          hasUserLocation={Boolean(geo.position)}
        />
      </div>

      <AsyncLoadHint
        className="mt-4"
        showSlowHint={loading && showSlowHint && !error}
        showRecovery={loading && showRecovery && !error}
        error={error}
        onRetry={() => void reload()}
        slowMessage="Loading map data…"
      />

      {loading ? (
        <ul className="mt-6 space-y-4" aria-busy="true">
          {[1, 2].map((i) => (
            <li key={i}>
              <PostCardSkeleton />
            </li>
          ))}
        </ul>
      ) : filtered.length === 0 && !error ? (
        <div className="mt-8">
          <EmptyState
            icon={Map}
            title="No results on the map"
            description="Try changing filters, widening your near-me radius, or create a movement with a location."
          />
          {isMember && (
            <p className="mt-6 text-center">
              <Link to="/create" className="btn-primary">
                Create a Youth Movement
              </Link>
            </p>
          )}
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-5">
          <div className="card-surface order-2 flex min-h-80 flex-col overflow-hidden lg:order-1 lg:max-h-[calc(100vh-12rem)]">
            <ImpactMapList
              entries={filtered}
              selectedId={selectedId}
              onSelect={handleSelectEntry}
              mobileExpanded={mobileListOpen}
              onToggleMobile={() => setMobileListOpen((o) => !o)}
            />
          </div>

          <div className="order-1 flex min-h-0 flex-col gap-4 lg:order-2">
            <div className="card-surface overflow-hidden p-1 lg:min-h-[min(520px,65vh)]">
              <ImpactMapCanvas
                entries={mappable}
                selectedId={selectedId}
                onSelect={(id) => {
                  if (!id) {
                    setSelectedId(null)
                    return
                  }
                  const entry = filtered.find((e) => e.id === id)
                  if (entry) handleSelectEntry(entry)
                }}
                flyTo={flyTo}
                className="min-h-[min(50vh,420px)]"
              />
            </div>

            {selectedEntry && (
              <ImpactMapDetail
                entry={selectedEntry}
                detailPath={`${detailBase}/${selectedEntry.id}`}
                onClose={() => setSelectedId(null)}
              />
            )}
          </div>
        </div>
      )}

      <p className="mt-6 text-center text-xs text-muted">
        Map pins use coordinates when provided. Approximate pins are labeled and based on area
        names only — not GPS-precise locations.
      </p>
    </div>
  )
}
