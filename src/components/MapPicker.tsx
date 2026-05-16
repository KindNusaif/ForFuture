import { useEffect, useRef, useState } from 'react'
import { MapPin } from 'lucide-react'
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  SELECTED_MAP_ZOOM,
  type MapLocation,
  hasValidCoordinates,
  isGoogleMapsConfigured,
  loadGoogleMaps,
} from '../lib/googleMaps'

interface MapPickerProps {
  value: MapLocation
  onChange: (value: MapLocation) => void
  disabled?: boolean
  label?: string
}

export default function MapPicker({
  value,
  onChange,
  disabled,
  label = 'Location on map',
}: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<google.maps.Map | null>(null)
  const markerRef = useRef<google.maps.Marker | null>(null)
  const [mapError, setMapError] = useState<string | null>(null)
  const [mapReady, setMapReady] = useState(false)

  const mapsEnabled = isGoogleMapsConfigured()

  useEffect(() => {
    if (!mapsEnabled || disabled || !mapRef.current) return

    let cancelled = false

    async function init() {
      try {
        await loadGoogleMaps()
        if (cancelled || !mapRef.current) return

        const center = hasValidCoordinates(value)
          ? { lat: value.latitude, lng: value.longitude }
          : DEFAULT_MAP_CENTER

        const zoom = hasValidCoordinates(value) ? SELECTED_MAP_ZOOM : DEFAULT_MAP_ZOOM

        const map = new google.maps.Map(mapRef.current, {
          center,
          zoom,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        })

        const marker = new google.maps.Marker({
          map,
          position: hasValidCoordinates(value) ? center : undefined,
          draggable: !disabled,
        })

        map.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (!e.latLng || disabled) return
          const lat = e.latLng.lat()
          const lng = e.latLng.lng()
          marker.setPosition({ lat, lng })
          onChange({
            ...value,
            latitude: lat,
            longitude: lng,
            location_name: value.location_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          })
        })

        marker.addListener('dragend', () => {
          const pos = marker.getPosition()
          if (!pos) return
          const lat = pos.lat()
          const lng = pos.lng()
          onChange({
            ...value,
            latitude: lat,
            longitude: lng,
          })
        })

        mapInstance.current = map
        markerRef.current = marker
        setMapReady(true)
        setMapError(null)
      } catch {
        if (!cancelled) setMapError('Could not load Google Maps. Check your API key.')
      }
    }

    void init()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- map initializes once per mount
  }, [mapsEnabled, disabled])

  useEffect(() => {
    if (!mapReady || !markerRef.current || !mapInstance.current) return
    if (!hasValidCoordinates(value)) return
    const pos = { lat: value.latitude, lng: value.longitude }
    markerRef.current.setPosition(pos)
    mapInstance.current.panTo(pos)
    mapInstance.current.setZoom(SELECTED_MAP_ZOOM)
  }, [value.latitude, value.longitude, mapReady])

  if (!mapsEnabled) {
    return (
      <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
        <MapPin className="mb-1 inline h-4 w-4 text-slate-400" /> Add{' '}
        <code className="rounded bg-white px-1">VITE_GOOGLE_MAPS_API_KEY</code> to enable the
        interactive map. You can still enter a location name above.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-slate-600">{label}</p>
      {mapError ? (
        <p className="text-xs text-amber-700">{mapError}</p>
      ) : (
        <div
          ref={mapRef}
          className="h-48 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 sm:h-56"
          role="application"
          aria-label="Map location picker"
        />
      )}
      <p className="text-xs text-slate-500">Click the map or drag the marker to set coordinates.</p>
    </div>
  )
}
