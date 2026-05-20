import { useCallback } from 'react'
import { useAuthUser } from './useAuthUser'
import { useJoinMovement } from './useJoinMovement'
import type { JoinMovementModalVariant } from '../context/join-movement-context'

/**
 * Central guest gate: run member actions only when signed in; otherwise open the join modal.
 * Returns true when the action ran (member), false when gated (guest).
 */
export function useAuthGate() {
  const { isGuest, isMember, loading } = useAuthUser()
  const { openJoinModal } = useJoinMovement()

  const gate = useCallback(
    (variant: JoinMovementModalVariant = 'default', action?: () => void | Promise<void>) => {
      if (loading) return false
      if (isMember) {
        void action?.()
        return true
      }
      if (typeof document !== 'undefined') {
        document.documentElement.dataset.lastGuestAction = variant
      }
      openJoinModal(variant)
      return false
    },
    [isMember, loading, openJoinModal],
  )

  const gateAction = useCallback(
    (variant: JoinMovementModalVariant, action: () => void | Promise<void>) => {
      return () => {
        gate(variant, action)
      }
    },
    [gate],
  )

  return {
    isGuest,
    isMember,
    loading,
    openJoinModal,
    gate,
    gateAction,
  }
}
