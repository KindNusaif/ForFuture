import { useCallback, useEffect, useRef, useState } from 'react'
import { Crosshair, Loader2, MapPin, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { inputClass } from './AuthForm'
import {
  DEFAULT_MAP_ZOOM,
  SEARCH_MAP_ZOOM,
  SELECTED_MAP_ZOOM,
  getDefaultMapCenter,
  getMapCountryBias,
  getResolvedMapTheme,
  hasValidCoordinates,
  isGoogleMapsConfigured,
  loadGoogleMaps,
  placeToMapLocation,
  reverseGeocode,
  type MapLocation,
} from '../lib/googleMaps'

interface MapPickerProps {
  value: MapLocation
  onChange: (value: MapLocation) => void
  disabled?: boolean
  label?: string
  placeholder?: string
}

export default function MapPicker({
  value,
  onChange,
  disabled,
  label,
  placeholder,
}: MapPickerProps) {
  const { t } = useTranslation()
  const mapRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const mapInstance = useRef<google.maps.Map | null>(null)
  const markerRef = useRef<google.maps.Marker | null>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const onChangeRef = useRef(onChange)
  const initialLocationRef = useRef(value)
  const [mapError, setMapError] = useState<string | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [locating, setLocating] = useState(false)
  const [searchDraft, setSearchDraft] = useState<string | null>(null)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  const searchText = searchDraft ?? value.location_name

  const mapsEnabled = isGoogleMapsConfigured()
  const resolvedLabel = label ?? t('map.pickerLabel')

  const applyLocation = useCallback(async (next: MapLocation, reverseLookup = false) => {
    let locationName = next.location_name
    if (
      reverseLookup &&
      hasValidCoordinates(next) &&
      (!locationName || /^-?\d+\.\d+/.test(locationName))
    ) {
      const address = await reverseGeocode(next.latitude, next.longitude)
      if (address) locationName = address
    }
    const resolved = { ...next, location_name: locationName }
    setSearchDraft(null)
    onChangeRef.current(resolved)
  }, [])

  useEffect(() => {
    if (!mapsEnabled || disabled || !mapRef.current) return

    let cancelled = false

    async function init() {
      try {
        await loadGoogleMaps()
        if (cancelled || !mapRef.current) return

        const initial = initialLocationRef.current
        const center = hasValidCoordinates(initial)
          ? { lat: initial.latitude, lng: initial.longitude }
          : getDefaultMapCenter()

        const zoom = hasValidCoordinates(initial) ? SELECTED_MAP_ZOOM : DEFAULT_MAP_ZOOM

        const map = new google.maps.Map(mapRef.current, {
          center,
          zoom,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          colorScheme: getResolvedMapTheme(),
          gestureHandling: 'greedy',
        })

        const marker = new google.maps.Marker({
          map,
          position: hasValidCoordinates(initial) ? center : undefined,
          draggable: !disabled,
        })

        map.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (!e.latLng || disabled) return
          const lat = e.latLng.lat()
          const lng = e.latLng.lng()
          marker.setPosition({ lat, lng })
          void applyLocation(
            { latitude: lat, longitude: lng, location_name: initial.location_name },
            true,
          )
        })

        marker.addListener('dragend', () => {
          const pos = marker.getPosition()
          if (!pos) return
          void applyLocation(
            {
              latitude: pos.lat(),
              longitude: pos.lng(),
              location_name: initial.location_name,
            },
            true,
          )
        })

        if (searchRef.current && !autocompleteRef.current) {
          const bias = getMapCountryBias()
          const autocomplete = new google.maps.places.Autocomplete(searchRef.current, {
            fields: ['place_id', 'geometry', 'name', 'formatted_address', 'vicinity'],
            types: ['establishment', 'geocode'],
            ...(bias?.length === 1 ? { componentRestrictions: { country: bias[0] } } : {}),
          })

          if (bias && bias.length > 1) {
            autocomplete.setOptions({ componentRestrictions: { country: bias } })
          }

          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace()
            const mapped = placeToMapLocation(place)
            if (!mapped || mapped.latitude == null || mapped.longitude == null) return
            marker.setPosition({ lat: mapped.latitude, lng: mapped.longitude })
            map.panTo({ lat: mapped.latitude, lng: mapped.longitude })
            map.setZoom(SEARCH_MAP_ZOOM)
            void applyLocation(mapped)
          })

          autocompleteRef.current = autocomplete
        }

        mapInstance.current = map
        markerRef.current = marker
        setMapReady(true)
        setMapError(null)
      } catch {
        if (!cancelled) setMapError(t('map.loadError'))
      }
    }

    void init()

    return () => {
      cancelled = true
      if (mapInstance.current) {
        google.maps.event.clearInstanceListeners(mapInstance.current)
      }
      autocompleteRef.current = null
    }
  }, [mapsEnabled, disabled, applyLocation, t])

  const latitude = value.latitude
  const longitude = value.longitude

  useEffect(() => {
    if (!mapReady || !markerRef.current || !mapInstance.current) return
    if (latitude == null || longitude == null) return
    const pos = { lat: latitude, lng: longitude }
    markerRef.current.setPosition(pos)
    mapInstance.current.panTo(pos)
    if ((mapInstance.current.getZoom() ?? 0) < SEARCH_MAP_ZOOM) {
      mapInstance.current.setZoom(SELECTED_MAP_ZOOM)
    }
  }, [latitude, longitude, mapReady])

  function handleLocateMe() {
    if (!navigator.geolocation || disabled) return
    setLocating(true)
    setMapError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        markerRef.current?.setPosition({ lat, lng })
        mapInstance.current?.panTo({ lat, lng })
        mapInstance.current?.setZoom(SELECTED_MAP_ZOOM)
        void applyLocation({ latitude: lat, longitude: lng, location_name: '' }, true).finally(
          () => setLocating(false),
        )
      },
      () => {
        setMapError(t('map.geolocationDenied'))
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60_000 },
    )
  }

  function handleSearchBlur() {
    const trimmed = searchText.trim()
    if (trimmed && trimmed !== value.location_name) {
      onChangeRef.current({ ...value, location_name: trimmed })
    }
    setSearchDraft(null)
  }

  if (!mapsEnabled) {
    return (
      <div className="map-picker-fallback rounded-xl border border-default bg-muted/50 px-4 py-3 text-xs text-secondary">
        <MapPin className="mb-1 inline h-4 w-4 text-muted" aria-hidden />
        <p className="font-medium text-primary">{t('map.notConfiguredTitle')}</p>
        <p className="mt-1 leading-relaxed">{t('map.notConfiguredBody')}</p>
        <p className="mt-2 text-[11px] text-muted">{t('map.notConfiguredHint')}</p>
        {import.meta.env.DEV ? (
          <ol className="mt-2 list-decimal space-y-1 pl-4 text-[11px]">
            <li>{t('map.setupStep1')}</li>
            <li>{t('map.setupStep2')}</li>
            <li>{t('map.setupStep3')}</li>
          </ol>
        ) : null}
      </div>
    )
  }

  return (
    <div className="map-picker space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold text-primary">{resolvedLabel}</p>
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={disabled || locating || !mapReady}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-default bg-surface px-2.5 py-1.5 text-xs font-semibold text-primary transition hover:bg-muted disabled:opacity-50"
        >
          {locating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <Crosshair className="h-3.5 w-3.5 text-accent-600" aria-hidden />
          )}
          {t('map.useMyLocation')}
        </button>
      </div>

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          aria-hidden
        />
        <input
          ref={searchRef}
          type="text"
          value={searchText}
          onChange={(e) => setSearchDraft(e.target.value)}
          onBlur={handleSearchBlur}
          disabled={disabled || !mapReady}
          placeholder={placeholder ?? t('map.searchPlaceholder')}
          className={`${inputClass} mt-0! pl-9`}
          autoComplete="off"
          aria-label={t('map.searchPlaceholder')}
        />
      </div>

      {mapError ? (
        <p className="text-xs text-amber-700 dark:text-amber-300" role="alert">
          {mapError}
        </p>
      ) : null}

      <div className="relative overflow-hidden rounded-xl border border-default bg-muted">
        {!mapReady && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted/80">
            <Loader2 className="h-6 w-6 animate-spin text-accent-600" aria-hidden />
            <span className="sr-only">{t('map.loading')}</span>
          </div>
        )}
        <div
          ref={mapRef}
          className="h-52 w-full sm:h-60"
          role="application"
          aria-label={t('map.pickerAria')}
        />
      </div>

      <p className="text-[11px] leading-relaxed text-muted">{t('map.pickerHint')}</p>

      {hasValidCoordinates(value) && (
        <p className="text-[11px] tabular-nums text-muted">
          {value.latitude!.toFixed(5)}, {value.longitude!.toFixed(5)}
        </p>
      )}
    </div>
  )
}
