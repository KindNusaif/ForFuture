import { Navigate, useLocation } from 'react-router-dom'

/** Legacy alias — guest browse lives at /explore. */
export default function Movements() {
  const location = useLocation()
  return <Navigate to={`/explore${location.search}`} replace />
}
