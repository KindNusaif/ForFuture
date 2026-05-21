import { createContext } from 'react'
import type { JoinMovementModalVariant } from './join-movement-context'

export interface JoinMovementModalState {
  open: boolean
  variant: JoinMovementModalVariant
  returnPath: string
  onClose: () => void
}

export const JoinMovementModalContext = createContext<JoinMovementModalState | null>(null)
