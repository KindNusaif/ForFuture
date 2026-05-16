import { createContext } from 'react'

export type JoinMovementModalVariant = 'default' | 'report' | 'petition'

export interface JoinMovementContextValue {
  openJoinModal: (variant?: JoinMovementModalVariant) => void
}

export const JoinMovementContext = createContext<JoinMovementContextValue | null>(null)
