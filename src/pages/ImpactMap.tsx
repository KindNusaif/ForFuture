import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { List, Map } from 'lucide-react'
import GuestModeBanner from '../components/guidance/GuestModeBanner'
import GuidanceHint from '../components/guidance/GuidanceHint'
import ImpactMapCanvas from '../components/impact-map/ImpactMapCanvas'
import ImpactMapDetail from '../components/impact-map/ImpactMapDetail'
import ImpactMapFilters from '../components/impact-map/ImpactMapFilters'
import ImpactMapList from '../components/impact-map/ImpactMapList'
import ImpactMapStats from '../components/impact-map/ImpactMapStats'
import EmptyState from '../components/EmptyState'
import CreateMovementCta from '../components/create/CreateMovementCta'
import AsyncLoadHint from '../components/AsyncLoadHint'
import { useLoadingProgress } from '../hooks/useLoadingProgress'
import { usePageMeta } from '../hooks/usePageMeta'
import { PostCardSkeleton } from '../components/Skeleton'
import { useGeolocation } from '../hooks/useGeolocation'
import { useImpactMapData } from '../hooks/useImpactMapData'
import { useAuth } from '../hooks/useAuth'
import { FOCUSED_MAP_ZOOM, USER_LOCATION_ZOOM } from '../lib/mapConfig'
import { forwardGeocode, isGoogleMapsConfigured, reverseGeocode } from '../lib/googleMaps'
import type { ImpactMapEntry } from '../lib/impactMap'

type MobilePanel = 'map' | 'list'

export default function ImpactMapPage() {
  const { t } = useTranslation()
  const { isMember } = useAuth()

  usePageMeta({
    title: t('impactMap.pageTitle', { defaultValue: 'Impact Map' }),
    description: t('impactMap.metaDescription', {
      defaultValue: 'See youth civic action, volunteer drives, and community issues on an interactive map.',
    }),
    path: isMember ? '/impact-map' : '/explore/impact-map',
  })

  const geo = useGeolocation({ tryInitialOnMount: false })
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
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('list')
  const [mobileListOpen, setMobileListOpen] = useState(true)
  const [detectedAreaLabel, setDetectedAreaLabel] = useState<string | null>(null)
  const pendingNearMeRef = useRef(false)
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

  const detailBase = isMember ? '/feed' : '/explore'

  const flyTo = useMemo(() => {
    if (selectionFlyTo) return selectionFlyTo
    if (geo.position && filters.nearMeEnabled) {
      return { lat: geo.position.lat, lng: geo.position.lng, zoom: USER_LOCATION_ZOOM }
    }
    return null
  }, [selectionFlyTo, geo.position, filters.nearMeEnabled])

  const showMapEmptyOverlay = filtered.length > 0 && mappable.length === 0

  useEffect(() => {
    if (!geo.position) {
      setDetectedAreaLabel(null)
      return
    }
    if (!isGoogleMapsConfigured()) return

    let cancelled = false
    void reverseGeocode(geo.position.lat, geo.position.lng).then((label) => {
      if (!cancelled && label) setDetectedAreaLabel(label)
    })
    return () => {
      cancelled = true
    }
  }, [geo.position?.lat, geo.position?.lng])

  useEffect(() => {
    if (!geo.position || geo.loading) return
    if (pendingNearMeRef.current) {
      filters.setNearMeEnabled(true)
      pendingNearMeRef.current = false
    }
  }, [geo.position, geo.loading, filters])

  useEffect(() => {
    if (geo.error && pendingNearMeRef.current) {
      pendingNearMeRef.current = false
    }
  }, [geo.error])

  useEffect(() => {
    if (!filters.district || !isGoogleMapsConfigured()) return
    let cancelled = false
    void forwardGeocode(`${filters.district}, Sri Lanka`).then((coords) => {
      if (cancelled || !coords) return
      setSelectionFlyTo({ lat: coords.lat, lng: coords.lng, zoom: FOCUSED_MAP_ZOOM })
    })
    return () => {
      cancelled = true
    }
  }, [filters.district])

  function handleSelectEntry(entry: ImpactMapEntry) {
    setSelectedId(entry.id)
    if (entry.latitude != null && entry.longitude != null) {
      setSelectionFlyTo({
        lat: entry.latitude,
        lng: entry.longitude,
        zoom: FOCUSED_MAP_ZOOM,
      })
    }
    setMobilePanel('map')
  }

  const handleUseMyLocation = useCallback(() => {
    pendingNearMeRef.current = true
    setSelectionFlyTo(null)
    geo.requestLocation()
  }, [geo])

  const handleRequestLocationForNearMe = useCallback(() => {
    pendingNearMeRef.current = true
    geo.requestLocation()
  }, [geo])

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
      {!isMember ? <GuestModeBanner className="mb-6" /> : null}
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
        <GuidanceHint className="mt-2 max-w-2xl">
          {t('guidance.microcopy.map', {
            defaultValue: 'Use location to discover nearby issues and volunteer opportunities.',
          })}
        </GuidanceHint>
      </header>

      {!loading && !error && (
        <ImpactMapStats
          volunteer={stats.volunteer}
          civic={stats.civic}
          issues={stats.issues}
          relief={stats.relief}
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
          onRequestLocationForNearMe={handleRequestLocationForNearMe}
          geoLoading={geo.loading}
          geoError={geo.error}
          hasUserLocation={Boolean(geo.position)}
          detectedAreaLabel={detectedAreaLabel}
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
            title={t('guidance.empty.mapTitle', { defaultValue: 'No map activity yet' })}
            description={t('guidance.empty.mapDescription', {
              defaultValue: 'Movements with location details will appear on the Impact Map.',
            })}
            action={{
              label: t('guidance.empty.mapCta', { defaultValue: 'Browse Movements' }),
              to: isMember ? '/discover' : '/explore',
            }}
          />
          {isMember && (
            <p className="mt-6 text-center">
              <CreateMovementCta />
            </p>
          )}
        </div>
      ) : (
        <>
          <div
            className="mt-4 flex gap-2 lg:hidden"
            role="tablist"
            aria-label="Map or list view"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mobilePanel === 'map'}
              className={
                mobilePanel === 'map' ? 'profile-tab profile-tab-active flex-1' : 'profile-tab flex-1'
              }
              onClick={() => setMobilePanel('map')}
            >
              <Map className="mr-1.5 inline h-4 w-4" aria-hidden />
              Map
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mobilePanel === 'list'}
              className={
                mobilePanel === 'list' ? 'profile-tab profile-tab-active flex-1' : 'profile-tab flex-1'
              }
              onClick={() => setMobilePanel('list')}
            >
              <List className="mr-1.5 inline h-4 w-4" aria-hidden />
              List ({filtered.length})
            </button>
          </div>

          <div className="impact-map-split mt-4 lg:mt-6">
            <div
              className={`order-2 min-h-0 lg:order-1 ${mobilePanel === 'list' ? 'block' : 'hidden lg:block'}`}
            >
              <div className="card-surface flex h-full min-h-[min(40vh,420px)] flex-col overflow-hidden lg:min-h-[min(520px,65vh)]">
                <ImpactMapList
                  entries={filtered}
                  selectedId={selectedId}
                  onSelect={handleSelectEntry}
                  mobileExpanded={mobileListOpen}
                  onToggleMobile={() => setMobileListOpen((o) => !o)}
                />
              </div>
            </div>

            <div
              className={`order-1 flex min-h-0 flex-col gap-4 lg:order-2 ${mobilePanel === 'map' ? 'flex' : 'hidden lg:flex'}`}
            >
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
                  userLocation={geo.position}
                  showEmptyOverlay={showMapEmptyOverlay}
                  emptyOverlayMessage="No map pins match your filters. Adjust filters or browse the list — some results may only list an area without an exact pin."
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
        </>
      )}

      <p className="mt-6 text-center text-xs text-muted">
        Map pins use coordinates when provided. Approximate pins are labeled and based on area
        names only — not GPS-precise locations.
      </p>
    </div>
  )
}