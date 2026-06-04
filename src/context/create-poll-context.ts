import { createContext } from 'react'
import type { Post } from '../types'

export type PollPublishedListener = (post: Post) => void

export interface CreatePollContextValue {
  openCreatePoll: () => void
  registerPollPublishedListener: (listener: PollPublishedListener) => () => void
}

export const CreatePollContext = createContext<CreatePollContextValue | null>(null)
