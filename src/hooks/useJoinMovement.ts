import { useContext } from 'react'
import { JoinMovementContext } from '../context/join-movement-context'

export function useJoinMovement() {
  const ctx = useContext(JoinMovementContext)
  if (!ctx) throw new Error('useJoinMovement must be used within JoinMovementProvider')
  return ctx
}
