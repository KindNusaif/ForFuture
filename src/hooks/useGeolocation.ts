import { useCallback, useEffect, useRef, useState } from 'react'

export interface GeoPosition {
  lat: number
  lng: number
}

interface UseGeolocationOptions {
  tryInitialOnMount?: boolean
}

interface UseGeolocationResult {
  position: GeoPosition | null
  loading: boolean
  error: string | null
  requested: boolean
  requestLocation: () => void
  clearLocation: () => void
}

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 12_000,
  maximumAge: 120_000,
}

export function useGeolocation(options: UseGeolocationOptions = {}): UseGeolocationResult {
  const { tryInitialOnMount = true } = options
  const [position, setPosition] = useState<GeoPosition | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [requested, setRequested] = useState(false)
  const initialAttempted = useRef(false)

  const requestLocation = useCallback(() => {
    setRequested(true)
    setError(null)

    if (!navigator.geolocation) {
      setError('Location is not supported in this browser. You can still search by district or area.')
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
          setError(
            'We couldn’t access your location. You can still search by district or area.',
          )
        } else {
          setError(
            'We couldn’t access your location. You can still search by district or area.',
          )
        }
      },
      GEO_OPTIONS,
    )
  }, [])

  useEffect(() => {
    if (!tryInitialOnMount || initialAttempted.current) return
    if (!navigator.geolocation) return
    initialAttempted.current = true
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLoading(false)
        setError(null)
        setRequested(true)
      },
      () => {
        setLoading(false)
      },
      { ...GEO_OPTIONS, maximumAge: 300_000 },
    )
  }, [tryInitialOnMount])

  const clearLocation = useCallback(() => {
    setPosition(null)
    setError(null)
    setRequested(false)
  }, [])

  return { position, loading, error, requested, requestLocation, clearLocation }
}
