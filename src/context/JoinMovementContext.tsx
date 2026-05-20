import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import JoinMovementModal from '../components/JoinMovementModal'
import { buildAuthReturn } from '../lib/authReturn'
import { JoinMovementContext, type JoinMovementModalVariant } from './join-movement-context'

export function JoinMovementProvider({ children }: { children: ReactNode }) {
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [variant, setVariant] = useState<JoinMovementModalVariant>('default')
  const [returnPath, setReturnPath] = useState('/feed')

  const openJoinModal = useCallback(
    (nextVariant: JoinMovementModalVariant = 'default', explicitReturn?: string) => {
      const path =
        explicitReturn ??
        buildAuthReturn(location.pathname, location.search, location.hash)
      setVariant(nextVariant)
      setReturnPath(path)
      setOpen(true)
    },
    [location.pathname, location.search, location.hash],
  )

  const closeJoinModal = useCallback(() => {
    setOpen(false)
    setVariant('default')
  }, [])

  const value = useMemo(() => ({ openJoinModal }), [openJoinModal])

  return (
    <JoinMovementContext.Provider value={value}>
      {children}
      <JoinMovementModal
        open={open}
        variant={variant}
        returnPath={returnPath}
        onClose={closeJoinModal}
      />
    </JoinMovementContext.Provider>
  )
}
