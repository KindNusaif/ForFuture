import { useContext } from 'react'
import JoinMovementModal from './JoinMovementModal'
import { JoinMovementModalContext } from '../context/join-movement-modal-context'

/** Mount inside BrowserRouter — modal uses react-router Link. */
export default function JoinMovementModalHost() {
  const modal = useContext(JoinMovementModalContext)
  if (!modal) return null

  return (
    <JoinMovementModal
      open={modal.open}
      variant={modal.variant}
      returnPath={modal.returnPath}
      onClose={modal.onClose}
    />
  )
}
