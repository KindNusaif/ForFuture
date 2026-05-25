import { useEffect, useRef, useState } from 'react'
import { MapPin } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { DEFAULT_MAP_ZOOM, FOCUSED_MAP_ZOOM, USER_LOCATION_ZOOM } from '../../lib/mapConfig'
import {
  DEFAULT_MAP_CENTER as GOOGLE_DEFAULT_CENTER,
  getGoogleMapStyles,
  isGoogleMapsConfigured,
  loadGoogleMaps,
} from '../../lib/googleMaps'
import type { ImpactMapEntry } from '../../lib/impactMap'
import { createImpactMarkerIconUrl } from '../../lib/impactMapMarkers'

interface ImpactMapCanvasProps {
  entries: ImpactMapEntry[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  flyTo?: { lat: number; lng: number; zoom?: number } | null
  userLocation?: { lat: number; lng: number } | null
  showEmptyOverlay?: boolean
  emptyOverlayMessage?: string
  className?: string
}

export default function ImpactMapCanvas({
  entries,
  selectedId,
  onSelect,
  flyTo,
  userLocation,
  showEmptyOverlay = false,
  emptyOverlayMessage = 'No map pins for the current filters. Browse the list or adjust filters.',
  className = '',
}: ImpactMapCanvasProps) {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map())
  const userMarkerRef = useRef<google.maps.Marker | null>(null)
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null)
  const [mapError, setMapError] = useState<string | null>(null)
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    if (!isGoogleMapsConfigured()) {
      setMapError('not_configured')
      return
    }

    let cancelled = false
    let themeObserver: MutationObserver | null = null

    void (async () => {
      try {
        await loadGoogleMaps()
        if (cancelled || !containerRef.current) return

        const center = userLocation
          ? { lat: userLocation.lat, lng: userLocation.lng }
          : { lat: GOOGLE_DEFAULT_CENTER.lat, lng: GOOGLE_DEFAULT_CENTER.lng }
        const zoom = userLocation ? USER_LOCATION_ZOOM : DEFAULT_MAP_ZOOM

        const map = new google.maps.Map(containerRef.current, {
          center,
          zoom,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          styles: getGoogleMapStyles(),
        })

        mapRef.current = map
        infoWindowRef.current = new google.maps.InfoWindow()
        setMapReady(true)
        setMapError(null)

        themeObserver = new MutationObserver(() => {
          map.setOptions({ styles: getGoogleMapStyles() })
        })
        themeObserver.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ['data-theme'],
        })
      } catch {
        if (!cancelled) {
          setMapError('load_failed')
        }
      }
    })()

    return () => {
      cancelled = true
      themeObserver?.disconnect()
      markersRef.current.forEach((m) => m.setMap(null))
      markersRef.current.clear()
      userMarkerRef.current?.setMap(null)
      userMarkerRef.current = null
      infoWindowRef.current?.close()
      infoWindowRef.current = null
      mapRef.current = null
      setMapReady(false)
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return

    markersRef.current.forEach((marker) => marker.setMap(null))
    markersRef.current.clear()
    infoWindowRef.current?.close()

    const bounds = new google.maps.LatLngBounds()
    let hasBounds = false

    for (const entry of entries) {
      if (
        !entry.hasPreciseCoordinates ||
        entry.latitude == null ||
        entry.longitude == null
      ) {
        continue
      }

      const position = { lat: entry.latitude, lng: entry.longitude }
      bounds.extend(position)
      hasBounds = true

      const selected = entry.id === selectedId
      const marker = new google.maps.Marker({
        map,
        position,
        title: entry.title,
        icon: {
          url: createImpactMarkerIconUrl(entry.layerType, selected),
          scaledSize: new google.maps.Size(selected ? 36 : 28, selected ? 36 : 28),
          anchor: new google.maps.Point(selected ? 18 : 14, selected ? 18 : 14),
        },
        zIndex: selected ? 1000 : 1,
      })

      marker.addListener('click', () => {
        onSelect(entry.id)
        const iw = infoWindowRef.current
        if (iw) {
          iw.setContent(
            `<div style="max-width:220px;font-family:system-ui,sans-serif;padding:2px 0">
              <p style="margin:0 0 4px;font-size:10px;font-weight:700;text-transform:uppercase;color:#6366f1">${entry.layerType.replace('_', ' ')}</p>
              <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#0f172a">${escapeHtml(entry.title)}</p>
              ${entry.district ? `<p style="margin:0;font-size:11px;color:#64748b">${escapeHtml(entry.district)}</p>` : ''}
            </div>`,
          )
          iw.open({ map, anchor: marker })
        }
      })

      markersRef.current.set(entry.id, marker)
    }

    if (selectedId) {
      const entry = entries.find((e) => e.id === selectedId)
      const marker = markersRef.current.get(selectedId)
      if (entry && marker && entry.latitude != null && entry.longitude != null) {
        map.panTo({ lat: entry.latitude, lng: entry.longitude })
        map.setZoom(FOCUSED_MAP_ZOOM)
        const iw = infoWindowRef.current
        if (iw) {
          iw.setContent(
            `<div style="max-width:220px;font-family:system-ui,sans-serif;padding:2px 0">
              <p style="margin:0 0 4px;font-size:10px;font-weight:700;text-transform:uppercase;color:#6366f1">${entry.layerType.replace('_', ' ')}</p>
              <p style="margin:0;font-size:13px;font-weight:600;color:#0f172a">${escapeHtml(entry.title)}</p>
            </div>`,
          )
          iw.open({ map, anchor: marker })
        }
      }
    }

    if (!selectedId && !flyTo) {
      if (hasBounds && entries.length > 0) {
        map.fitBounds(bounds, { top: 48, right: 48, bottom: 48, left: 48 })
      } else if (userLocation) {
        map.setCenter({ lat: userLocation.lat, lng: userLocation.lng })
        map.setZoom(USER_LOCATION_ZOOM)
      } else {
        map.setCenter({ lat: GOOGLE_DEFAULT_CENTER.lat, lng: GOOGLE_DEFAULT_CENTER.lng })
        map.setZoom(DEFAULT_MAP_ZOOM)
      }
    }
  }, [entries, selectedId, onSelect, mapReady, flyTo, userLocation])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady || !userLocation) {
      userMarkerRef.current?.setMap(null)
      userMarkerRef.current = null
      return
    }

    const position = { lat: userLocation.lat, lng: userLocation.lng }
    if (userMarkerRef.current) {
      userMarkerRef.current.setPosition(position)
    } else {
      userMarkerRef.current = new google.maps.Marker({
        map,
        position,
        title: 'You are here',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: '#818cf8',
          fillOpacity: 1,
          strokeColor: '#4f46e5',
          strokeWeight: 3,
        },
        zIndex: 2000,
      })
    }
  }, [userLocation, mapReady])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady || !flyTo) return
    map.panTo({ lat: flyTo.lat, lng: flyTo.lng })
    map.setZoom(flyTo.zoom ?? FOCUSED_MAP_ZOOM)
  }, [flyTo, mapReady])

  if (mapError) {
    const isSetup = mapError === 'not_configured'
    const title = isSetup
      ? t('map.notConfiguredTitle', { defaultValue: 'Map view unavailable' })
      : t('map.mapLoadError', {
          defaultValue: 'We could not load the map right now. You can still browse results in the list.',
        })
    const body = isSetup
      ? t('map.notConfiguredBody', {
          defaultValue:
            'Browse volunteer drives, relief needs, and civic actions in the list — the interactive map will appear when enabled on this site.',
        })
      : null

    return (
      <div
        className={`impact-map-fallback flex min-h-70 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-default bg-linear-to-br from-surface via-muted/30 to-accent-50/20 px-6 py-10 text-center dark:to-accent-950/20 ${className}`}
        role="status"
      >
        <span
          className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-50 text-accent-700 ring-1 ring-accent-200/80 dark:bg-accent-950/40 dark:text-accent-200 dark:ring-accent-500/30"
          aria-hidden
        >
          <MapPin className="h-7 w-7" />
        </span>
        <p className="max-w-sm text-base font-semibold text-primary">{title}</p>
        {body ? <p className="max-w-md text-sm leading-relaxed text-secondary">{body}</p> : null}
        <p className="max-w-md text-xs leading-relaxed text-muted">
          {t('map.notConfiguredHint', {
            defaultValue:
              'List results stay available. When the map is on, the default view centers on Sri Lanka.',
          })}
        </p>
        {import.meta.env.DEV && isSetup ? (
          <details className="mt-2 max-w-md text-left text-[11px] text-muted">
            <summary className="cursor-pointer font-medium text-secondary">Developer setup</summary>
            <ol className="mt-2 list-decimal space-y-1 pl-4">
              <li>{t('map.setupStep1')}</li>
              <li>{t('map.setupStep2')}</li>
              <li>{t('map.setupStep3')}</li>
            </ol>
          </details>
        ) : null}
      </div>
    )
  }

  return (
    <div className="relative h-full min-h-70 w-full">
      <div
        ref={containerRef}
        className={`h-full w-full rounded-2xl ${className}`}
        role="application"
        aria-label="Interactive impact map"
      />
      {!mapReady && (
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-surface/80 text-sm text-muted"
          aria-live="polite"
        >
          Loading map…
        </div>
      )}
      {showEmptyOverlay && mapReady && (
        <div
          className="pointer-events-none absolute inset-4 flex items-center justify-center rounded-xl border border-dashed border-default bg-surface/90 px-4 py-6 text-center backdrop-blur-sm"
          role="status"
        >
          <p className="max-w-xs text-sm leading-relaxed text-secondary">{emptyOverlayMessage}</p>
        </div>
      )}
    </div>
  )
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
