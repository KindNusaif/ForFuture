import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useToast } from '../hooks/useToast'
import { SESSION_EXPIRED_EVENT } from '../lib/sessionErrors'

const GUEST_PATHS = new Set(['/login', '/signup', '/forgot-password', '/reset-password'])

/**
 * Listens for global session-expiry signals and redirects to login with a friendly toast.
 */
export default function SessionExpiryHandler() {
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const handledRef = useRef(false)

  useEffect(() => {
    function onSessionExpired() {
      if (handledRef.current) return
      if (GUEST_PATHS.has(location.pathname)) return

      handledRef.current = true
      toast.error('Your session expired', 'Please sign in again to continue.')

      const returnTo = location.pathname + location.search
      navigate('/login', {
        replace: true,
        state: returnTo && returnTo !== '/' ? { from: returnTo } : undefined,
      })

      window.setTimeout(() => {
        handledRef.current = false
      }, 3000)
    }

    window.addEventListener(SESSION_EXPIRED_EVENT, onSessionExpired)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onSessionExpired)
  }, [location.pathname, location.search, navigate, toast])

  return null
}
