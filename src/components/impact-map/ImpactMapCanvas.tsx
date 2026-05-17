import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import 'leaflet.markercluster'
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  FOCUSED_MAP_ZOOM,
  getMapTileAttribution,
  getMapTileUrl,
} from '../../lib/mapConfig'
import type { ImpactMapEntry } from '../../lib/impactMap'
import { createImpactMarkerIcon } from './impactMapMarkers'

interface ImpactMapCanvasProps {
  entries: ImpactMapEntry[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  flyTo?: { lat: number; lng: number; zoom?: number } | null
  className?: string
}

export default function ImpactMapCanvas({
  entries,
  selectedId,
  onSelect,
  flyTo,
  className = '',
}: ImpactMapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null)
  const markersRef = useRef<Map<string, L.Marker>>(new Map())

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const markers = markersRef.current
    const map = L.map(containerRef.current, {
      center: DEFAULT_MAP_CENTER,
      zoom: DEFAULT_MAP_ZOOM,
      scrollWheelZoom: true,
    })

    L.tileLayer(getMapTileUrl(), {
      attribution: getMapTileAttribution(),
      maxZoom: 19,
    }).addTo(map)

    const cluster = L.markerClusterGroup({
      maxClusterRadius: 48,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
    })
    map.addLayer(cluster)

    mapRef.current = map
    clusterRef.current = cluster

    return () => {
      map.remove()
      mapRef.current = null
      clusterRef.current = null
      markers.clear()
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const cluster = clusterRef.current
    if (!map || !cluster) return

    cluster.clearLayers()
    markersRef.current.clear()

    const bounds: L.LatLngExpression[] = []

    for (const entry of entries) {
      if (entry.latitude == null || entry.longitude == null) continue

      const latLng: L.LatLngExpression = [entry.latitude, entry.longitude]
      bounds.push(latLng)

      const marker = L.marker(latLng, {
        icon: createImpactMarkerIcon(entry.layerType, entry.id === selectedId),
      })

      marker.on('click', () => onSelect(entry.id))
      markersRef.current.set(entry.id, marker)
      cluster.addLayer(marker)
    }

    if (bounds.length > 0 && !selectedId && !flyTo) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [40, 40], maxZoom: 12 })
    }
  }, [entries, selectedId, onSelect, flyTo])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    markersRef.current.forEach((marker, id) => {
      const entry = entries.find((e) => e.id === id)
      if (!entry) return
      marker.setIcon(createImpactMarkerIcon(entry.layerType, id === selectedId))
    })

    if (selectedId) {
      const entry = entries.find((e) => e.id === selectedId)
      if (entry?.latitude != null && entry?.longitude != null) {
        map.flyTo([entry.latitude, entry.longitude], FOCUSED_MAP_ZOOM, { duration: 0.6 })
      }
    }
  }, [selectedId, entries])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !flyTo) return
    map.flyTo([flyTo.lat, flyTo.lng], flyTo.zoom ?? FOCUSED_MAP_ZOOM, { duration: 0.6 })
  }, [flyTo])

  return (
    <div
      ref={containerRef}
      className={`h-full min-h-70 w-full rounded-2xl ${className}`}
      role="application"
      aria-label="Interactive impact map"
    />
  )
}
