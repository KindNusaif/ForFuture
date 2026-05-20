import type { ReactNode } from 'react'
import { useAuthGate } from '../../hooks/useAuthGate'
import type { JoinMovementModalVariant } from '../../context/join-movement-context'

interface GuestActionGuardProps {
  variant?: JoinMovementModalVariant
  /** Runs only when the viewer is a signed-in member. */
  onMemberAction?: () => void | Promise<void>
  children: (ctx: {
    run: () => void
    isGuest: boolean
    isMember: boolean
    loading: boolean
  }) => ReactNode
}

/**
 * Wraps interactive UI so guests open the auth conversion modal
 * while members execute the real action.
 */
export default function GuestActionGuard({
  variant = 'default',
  onMemberAction,
  children,
}: GuestActionGuardProps) {
  const { gate, isGuest, isMember, loading } = useAuthGate()

  function run() {
    gate(variant, onMemberAction)
  }

  return <>{children({ run, isGuest, isMember, loading })}</>
}
