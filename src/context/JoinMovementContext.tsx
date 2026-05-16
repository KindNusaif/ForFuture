import { useCallback, useMemo, useState, type ReactNode } from 'react'
import JoinMovementModal from '../components/JoinMovementModal'
import { JoinMovementContext } from './join-movement-context'

export function JoinMovementProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)

  const openJoinModal = useCallback(() => setOpen(true), [])
  const closeJoinModal = useCallback(() => setOpen(false), [])

  const value = useMemo(() => ({ openJoinModal }), [openJoinModal])

  return (
    <JoinMovementContext.Provider value={value}>
      {children}
      <JoinMovementModal open={open} onClose={closeJoinModal} />
    </JoinMovementContext.Provider>
  )
}
