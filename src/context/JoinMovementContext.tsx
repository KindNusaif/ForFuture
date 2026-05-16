import { useCallback, useMemo, useState, type ReactNode } from 'react'
import JoinMovementModal from '../components/JoinMovementModal'
import { JoinMovementContext, type JoinMovementModalVariant } from './join-movement-context'

export function JoinMovementProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [variant, setVariant] = useState<JoinMovementModalVariant>('default')

  const openJoinModal = useCallback((nextVariant: JoinMovementModalVariant = 'default') => {
    setVariant(nextVariant)
    setOpen(true)
  }, [])
  const closeJoinModal = useCallback(() => {
    setOpen(false)
    setVariant('default')
  }, [])

  const value = useMemo(() => ({ openJoinModal }), [openJoinModal])

  return (
    <JoinMovementContext.Provider value={value}>
      {children}
      <JoinMovementModal open={open} variant={variant} onClose={closeJoinModal} />
    </JoinMovementContext.Provider>
  )
}
