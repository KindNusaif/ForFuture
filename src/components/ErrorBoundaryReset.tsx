import { useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import ErrorBoundary from './ErrorBoundary'

/** Resets the error boundary when the route changes so users can recover without a full reload. */
export default function ErrorBoundaryReset({ children }: { children: ReactNode }) {
  const location = useLocation()
  return <ErrorBoundary key={location.pathname}>{children}</ErrorBoundary>
}
