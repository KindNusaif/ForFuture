/// <reference types="google.maps" />
import { importLibrary, setOptions } from '@googlemaps/js-api-loader'

export interface MapCoordinates {
  latitude: number | null
  longitude: number | null
}

export interface MapLocation extends MapCoordinates {
  location_name: string
}

/** Default center: Sri Lanka (youth civic focus); override via .env */
export function getDefaultMapCenter(): google.maps.LatLngLiteral {
  const lat = parseEnvNumber(import.meta.env.VITE_MAP_DEFAULT_LAT, 7.8731)
  const lng = parseEnvNumber(import.meta.env.VITE_MAP_DEFAULT_LNG, 80.7718)
  return { lat, lng }
}

export const DEFAULT_MAP_CENTER = getDefaultMapCenter()
export const DEFAULT_MAP_ZOOM = 7
export const SELECTED_MAP_ZOOM = 15
export const SEARCH_MAP_ZOOM = 14

function parseEnvNumber(raw: unknown, fallback: number): number {
  if (typeof raw !== 'string' || !raw.trim()) return fallback
  const n = Number(raw)
  return Number.isFinite(n) ? n : fallback
}

/** Optional ISO country code(s) to bias search (e.g. lk for Sri Lanka). */
export function getMapCountryBias(): string[] | undefined {
  const raw = import.meta.env.VITE_MAP_COUNTRY_BIAS
  if (typeof raw !== 'string' || !raw.trim()) return ['lk']
  const codes = raw
    .split(',')
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean)
  return codes.length > 0 ? codes : undefined
}

let mapsReady: Promise<typeof google.maps> | null = null

export function getGoogleMapsApiKey(): string | undefined {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  return typeof key === 'string' && key.trim() ? key.trim() : undefined
}

export function isGoogleMapsConfigured(): boolean {
  return Boolean(getGoogleMapsApiKey())
}

/** Loads Maps JavaScript API + Places (idempotent). */
export async function loadGoogleMaps(): Promise<typeof google.maps> {
  const apiKey = getGoogleMapsApiKey()
  if (!apiKey) {
    throw new Error('Google Maps API key is not configured.')
  }

  if (!mapsReady) {
    mapsReady = (async () => {
      setOptions({ key: apiKey, v: 'weekly' })
      await Promise.all([importLibrary('maps'), importLibrary('places')])
      return google.maps
    })()
  }

  return mapsReady
}

export function getResolvedMapTheme(): 'light' | 'dark' {
  if (typeof document === 'undefined') return 'light'
  const theme = document.documentElement.getAttribute('data-theme')
  if (theme === 'dark') return 'dark'
  if (theme === 'light') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function placeToMapLocation(
  place: google.maps.places.PlaceResult,
): MapLocation | null {
  const loc = place.geometry?.location
  if (!loc) return null
  const name =
    place.name?.trim() ||
    place.formatted_address?.trim() ||
    place.vicinity?.trim() ||
    ''
  return {
    latitude: loc.lat(),
    longitude: loc.lng(),
    location_name: name,
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  await loadGoogleMaps()
  const geocoder = new google.maps.Geocoder()
  return new Promise((resolve) => {
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status !== 'OK' || !results?.[0]) {
        resolve(null)
        return
      }
      resolve(results[0].formatted_address ?? null)
    })
  })
}

/** Static map image URL for feed previews (Maps Static API) */
export function getStaticMapUrl(
  latitude: number,
  longitude: number,
  options?: { width?: number; height?: number; zoom?: number },
): string | null {
  const apiKey = getGoogleMapsApiKey()
  if (!apiKey) return null

  const width = options?.width ?? 600
  const height = options?.height ?? 200
  const zoom = options?.zoom ?? 15
  const center = `${latitude},${longitude}`
  const marker = `color:0x059669%7C${latitude},${longitude}`

  const params = new URLSearchParams({
    center,
    zoom: String(zoom),
    size: `${width}x${height}`,
    scale: '2',
    markers: marker,
    key: apiKey,
  })

  return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`
}

export function hasValidCoordinates(coords: MapCoordinates): coords is {
  latitude: number
  longitude: number
} {
  return (
    coords.latitude != null &&
    coords.longitude != null &&
    Number.isFinite(coords.latitude) &&
    Number.isFinite(coords.longitude)
  )
}

export function getDisplayLocationName(post: {
  location_name?: string | null
  location?: string | null
  action_location?: string | null
  hospital_or_organizer?: string | null
  collection_location?: string | null
  movement_type: string
  donation_subtype?: string | null
}): string | null {
  if (post.location_name?.trim()) return post.location_name.trim()
  if (post.movement_type === 'donation_relief') {
    if (post.hospital_or_organizer?.trim()) return post.hospital_or_organizer.trim()
    if (post.collection_location?.trim()) return post.collection_location.trim()
  }
  if (post.movement_type === 'volunteer_drive' && post.location?.trim()) return post.location.trim()
  if (post.movement_type === 'peaceful_civic_action' && post.action_location?.trim()) {
    return post.action_location.trim()
  }
  return null
}
