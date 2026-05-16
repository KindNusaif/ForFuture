import { createContext } from 'react'

export interface JoinMovementContextValue {
  openJoinModal: () => void
}

export const JoinMovementContext = createContext<JoinMovementContextValue | null>(null)
