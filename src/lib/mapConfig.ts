/** Default map center (continental US) when no user location */
export const DEFAULT_MAP_CENTER: [number, number] = [39.8283, -98.5795]
export const DEFAULT_MAP_ZOOM = 4
export const FOCUSED_MAP_ZOOM = 13
export const USER_LOCATION_ZOOM = 11

/** OpenStreetMap tiles — override via VITE_MAP_TILE_URL in .env */
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

/** Default “Near me” radius in kilometers */
export const DEFAULT_NEAR_RADIUS_KM = 50
