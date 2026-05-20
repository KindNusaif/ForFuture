import type { JoinMovementModalVariant } from '../context/join-movement-context'
import type { MovementType } from '../types'

/** Auth-gate variant for support / volunteer / relief actions on a movement card. */
export function supportGateVariant(movementType: MovementType): JoinMovementModalVariant {
  return movementType === 'volunteer_drive' ? 'volunteer' : 'support'
}
