import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { buildAuthReturn } from '../lib/authReturn'
import { JoinMovementContext, type JoinMovementModalVariant } from './join-movement-context'
import { JoinMovementModalContext } from './join-movement-modal-context'

function currentReturnPath() {
  if (typeof window === 'undefined') return '/feed'
  return buildAuthReturn(window.location.pathname, window.location.search, window.location.hash)
}

export function JoinMovementProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [variant, setVariant] = useState<JoinMovementModalVariant>('default')
  const [returnPath, setReturnPath] = useState('/feed')

  const openJoinModal = useCallback(
    (nextVariant: JoinMovementModalVariant = 'default', explicitReturn?: string) => {
      setVariant(nextVariant)
      setReturnPath(explicitReturn ?? currentReturnPath())
      setOpen(true)
    },
    [],
  )

  const closeJoinModal = useCallback(() => {
    setOpen(false)
    setVariant('default')
  }, [])

  const value = useMemo(() => ({ openJoinModal }), [openJoinModal])

  const modalState = useMemo(
    () => ({
      open,
      variant,
      returnPath,
      onClose: closeJoinModal,
    }),
    [open, variant, returnPath, closeJoinModal],
  )

  return (
    <JoinMovementContext.Provider value={value}>
      <JoinMovementModalContext.Provider value={modalState}>
        {children}
      </JoinMovementModalContext.Provider>
    </JoinMovementContext.Provider>
  )
}
