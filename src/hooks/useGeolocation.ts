import { useCallback, useState } from 'react'

export interface GeoPosition {
  lat: number
  lng: number
}

interface UseGeolocationResult {
  position: GeoPosition | null
  loading: boolean
  error: string | null
  requested: boolean
  requestLocation: () => void
  clearLocation: () => void
}

export function useGeolocation(): UseGeolocationResult {
  const [position, setPosition] = useState<GeoPosition | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [requested, setRequested] = useState(false)

  const requestLocation = useCallback(() => {
    setRequested(true)
    setError(null)

    if (!navigator.geolocation) {
      setError('Location is not supported in this browser.')
      return
    }

    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLoading(false)
        setError(null)
      },
      (err) => {
        setLoading(false)
        setPosition(null)
        if (err.code === err.PERMISSION_DENIED) {
          setError('Location permission denied. Use district filters instead.')
        } else {
          setError('Could not determine your location. Try district filters.')
        }
      },
      { enableHighAccuracy: false, timeout: 12_000, maximumAge: 60_000 },
    )
  }, [])

  const clearLocation = useCallback(() => {
    setPosition(null)
    setError(null)
    setRequested(false)
  }, [])

  return { position, loading, error, requested, requestLocation, clearLocation }
}
