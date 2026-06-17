import { useEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

const scrollPositions = new Map<string, number>()

const LIST_ROUTE_PREFIXES = [
  '/feed',
  '/explore',
  '/discover',
  '/relief',
  '/explore/relief',
  '/inspire',
  '/polls',
  '/explore/polls',
  '/movements',
]

function routeKey(pathname: string, search: string): string {
  return `${pathname}${search}`
}

function isListRoute(pathname: string): boolean {
  return LIST_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

/** Scroll to top on forward navigation; restore position when returning via browser back. */
export default function ScrollRestoration() {
  const location = useLocation()
  const navigationType = useNavigationType()
  const prevKeyRef = useRef(routeKey(location.pathname, location.search))

  useEffect(() => {
    const key = routeKey(location.pathname, location.search)
    const prevKey = prevKeyRef.current

    if (navigationType === 'POP' && scrollPositions.has(key)) {
      const y = scrollPositions.get(key) ?? 0
      requestAnimationFrame(() => {
        window.scrollTo({ top: y, left: 0, behavior: 'instant' })
      })
    } else if (navigationType !== 'POP') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    }

    return () => {
      if (isListRoute(prevKey.split('?')[0] ?? prevKey)) {
        scrollPositions.set(prevKey, window.scrollY)
      }
      prevKeyRef.current = key
    }
  }, [location.pathname, location.search, navigationType])

  return null
}
