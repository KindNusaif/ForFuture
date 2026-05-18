import { useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import ErrorBoundary from './ErrorBoundary'

/**
 * Clears the error boundary when the route changes without remounting the full app.
 * (Using `key={pathname}` on the boundary remounted AuthProvider and caused first-click crashes.)
 */
export default function ErrorBoundaryReset({ children }: { children: ReactNode }) {
  const location = useLocation()
  const resetKey = location.pathname + location.search

  return <ErrorBoundary resetKey={resetKey}>{children}</ErrorBoundary>
}
