import { useContext } from 'react'
import { CreatePollContext } from '../context/create-poll-context'

export function useCreatePoll() {
  const ctx = useContext(CreatePollContext)
  if (!ctx) {
    throw new Error('useCreatePoll must be used within CreatePollProvider')
  }
  return ctx
}
