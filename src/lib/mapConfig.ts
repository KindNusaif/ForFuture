function parseEnvNumber(raw: unknown, fallback: number): number {
  if (typeof raw !== 'string' || !raw.trim()) return fallback
  const n = Number(raw)
  return Number.isFinite(n) ? n : fallback
}

export const SRI_LANKA_CENTER: [number, number] = [
  parseEnvNumber(import.meta.env.VITE_MAP_DEFAULT_LAT, 7.8731),
  parseEnvNumber(import.meta.env.VITE_MAP_DEFAULT_LNG, 80.7718),
]

export function getDefaultMapCenter(): [number, number] {
  return [...SRI_LANKA_CENTER] as [number, number]
}

export const DEFAULT_MAP_CENTER = getDefaultMapCenter()
export const DEFAULT_MAP_ZOOM = 7
export const FOCUSED_MAP_ZOOM = 13
export const USER_LOCATION_ZOOM = 11

export function getMapTileUrl(): string {
  const url = import.meta.env.VITE_MAP_TILE_URL
  if (typeof url === 'string' && url.trim()) return url.trim()
  return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
}

export function getMapTileAttribution(): string {
  const custom = import.meta.env.VITE_MAP_TILE_ATTRIBUTION
  if (typeof custom === 'string' && custom.trim()) return custom.trim()
  return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}

export const DEFAULT_NEAR_RADIUS_KM = 50
