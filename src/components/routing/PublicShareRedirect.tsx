import { Navigate, useParams } from 'react-router-dom'
import { guestMovementDetailPath } from '../../lib/guestExplore'

export default function PublicShareRedirect() {
  const { id } = useParams<{ id: string }>()
  if (!id) {
    return <Navigate to="/explore" replace />
  }
  return <Navigate to={guestMovementDetailPath(id)} replace />
}
