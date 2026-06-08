import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import CreatePollModal from '../components/polls/CreatePollModal'
import { useAuthGate } from '../hooks/useAuthGate'
import { useAuthUser } from '../hooks/useAuthUser'
import { useToast } from '../hooks/useToast'
import { notifyPollPublished } from '../lib/dataSync'
import { enrichPosts, fetchPostById } from '../lib/posts'
import { CreatePollContext, type PollPublishedListener } from './create-poll-context'
import type { Post } from '../types'

export function CreatePollProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const { isMember, loading, user } = useAuthUser()
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

  const notifyPublished = useCallback((post: import('../types').Post) => {
    listenersRef.current.forEach((listener) => {
      try {
        listener(post)
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

  const handlePublished = useCallback(
    (post: Post) => {
      setOpen(false)
      toast.success(t('polls.publishSuccess', { defaultValue: 'Poll published successfully.' }))
      void (async () => {
        try {
          const fresh = await fetchPostById(post.id, user?.id)
          const published = fresh ?? (await enrichPosts([post], user?.id))[0] ?? post
          const ownerId = published.user_id ?? user?.id
          if (ownerId) notifyPollPublished(published.id, ownerId)
          notifyPublished(published)
        } catch {
          const ownerId = post.user_id ?? user?.id
          if (ownerId) notifyPollPublished(post.id, ownerId)
          notifyPublished(post)
        }
      })()
    },
    [notifyPublished, t, toast, user?.id],
  )

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
