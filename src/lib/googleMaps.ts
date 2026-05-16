/// <reference types="google.maps" />
import { importLibrary, setOptions } from '@googlemaps/js-api-loader'

export interface MapCoordinates {
  latitude: number | null
  longitude: number | null
}

export interface MapLocation extends MapCoordinates {
  location_name: string
}

export const DEFAULT_MAP_CENTER = { lat: 39.8283, lng: -98.5795 }
export const DEFAULT_MAP_ZOOM = 4
export const SELECTED_MAP_ZOOM = 14

let mapsReady: Promise<void> | null = null

export function getGoogleMapsApiKey(): string | undefined {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  return typeof key === 'string' && key.trim() ? key.trim() : undefined
}

export function isGoogleMapsConfigured(): boolean {
  return Boolean(getGoogleMapsApiKey())
}

/** Loads Maps JavaScript API + Places (idempotent). */
export async function loadGoogleMaps(): Promise<void> {
  const apiKey = getGoogleMapsApiKey()
  if (!apiKey) {
    throw new Error('Google Maps API key is not configured.')
  }

  if (!mapsReady) {
    mapsReady = (async () => {
      setOptions({ key: apiKey, v: 'weekly' })
      await Promise.all([importLibrary('maps'), importLibrary('places')])
    })()
  }

  await mapsReady
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
  movement_type: string
}): string | null {
  if (post.location_name?.trim()) return post.location_name.trim()
  if (post.movement_type === 'volunteer_drive' && post.location?.trim()) return post.location.trim()
  if (post.movement_type === 'peaceful_civic_action' && post.action_location?.trim()) {
    return post.action_location.trim()
  }
  return null
}
