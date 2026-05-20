import { createContext } from 'react'

export type JoinMovementModalVariant =
  | 'default'
  | 'report'
  | 'comment'
  | 'petition'
  | 'actionpath'
  | 'follow'
  | 'volunteer'
  | 'create'
  | 'support'
  | 'following'
  | 'poll'
  | 'pollCreate'
  | 'inspire'
  | 'save'

export interface JoinMovementContextValue {
  openJoinModal: (variant?: JoinMovementModalVariant, explicitReturn?: string) => void
}

export const JoinMovementContext = createContext<JoinMovementContextValue | null>(null)
