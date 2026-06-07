import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { authStateFromPath } from '../lib/authReturn'
import { SESSION_EXPIRED_EVENT } from '../lib/sessionErrors'

const PUBLIC_PATHS = new Set([
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/movements',
  '/discover',
  '/impact',
  '/explore',
  '/privacy',
  '/terms',
  '/community-guidelines',
  '/contact',
])

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true
  if (pathname.startsWith('/explore')) return true
  return false
}

/**
 * Listens for global session-expiry signals and redirects signed-in users to login.
 */
export default function SessionExpiryHandler() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading, loggingOut } = useAuth()
  const toast = useToast()
  const handledRef = useRef(false)

  useEffect(() => {
    function onSessionExpired() {
      if (handledRef.current || loading || !user) return
      if (isPublicPath(location.pathname)) return

      handledRef.current = true
      toast.error('Your session expired', 'Please sign in again to continue.')

      const returnTo = location.pathname + location.search
      navigate('/login', {
        replace: true,
        state: returnTo && returnTo !== '/' ? authStateFromPath(returnTo) : undefined,
      })

      window.setTimeout(() => {
        handledRef.current = false
      }, 3000)
    }

    window.addEventListener(SESSION_EXPIRED_EVENT, onSessionExpired)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onSessionExpired)
  }, [location.pathname, location.search, navigate, toast, user, loading, loggingOut])

  return null
}
