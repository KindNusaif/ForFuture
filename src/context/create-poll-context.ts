import { createContext } from 'react'

export type PollPublishedListener = () => void

export interface CreatePollContextValue {
  openCreatePoll: () => void
  registerPollPublishedListener: (listener: PollPublishedListener) => () => void
}

export const CreatePollContext = createContext<CreatePollContextValue | null>(null)
