import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import CreatePollModal from '../components/polls/CreatePollModal'
import { useAuthGate } from '../hooks/useAuthGate'
import { useAuthUser } from '../hooks/useAuthUser'
import { useToast } from '../hooks/useToast'
import { CreatePollContext, type PollPublishedListener } from './create-poll-context'

export function CreatePollProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const { isMember, loading } = useAuthUser()
  const { gate } = useAuthGate()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const pendingOpenRef = useRef(false)
  const listenersRef = useRef(new Set<PollPublishedListener>())

  const registerPollPublishedListener = useCallback((listener: PollPublishedListener) => {
    listenersRef.current.add(listener)
    return () => {
      listenersRef.current.delete(listener)
    }
  }, [])

  const notifyPublished = useCallback(() => {
    listenersRef.current.forEach((listener) => {
      try {
        listener()
      } catch (err) {
        if (import.meta.env.DEV) console.error(err)
      }
    })
  }, [])

  const openCreatePoll = useCallback(() => {
    if (loading) {
      pendingOpenRef.current = true
      return
    }
    if (isMember) {
      setOpen(true)
      return
    }
    gate('pollCreate')
  }, [loading, isMember, gate])

  useEffect(() => {
    if (!loading && pendingOpenRef.current) {
      pendingOpenRef.current = false
      if (isMember) setOpen(true)
    }
  }, [loading, isMember])

  const handlePublished = useCallback(() => {
    setOpen(false)
    toast.success(t('polls.publishSuccess', { defaultValue: 'Poll published successfully.' }))
    notifyPublished()
  }, [notifyPublished, t, toast])

  const value = useMemo(
    () => ({ openCreatePoll, registerPollPublishedListener }),
    [openCreatePoll, registerPollPublishedListener],
  )

  return (
    <CreatePollContext.Provider value={value}>
      {children}
      {isMember && (
        <CreatePollModal
          open={open}
          onClose={() => setOpen(false)}
          onPublished={handlePublished}
        />
      )}
    </CreatePollContext.Provider>
  )
}
