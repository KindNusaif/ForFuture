import { createContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import type { Profile } from '../types'

export interface AuthContextValue {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  configured: boolean
  authError: string | null
  profileError: string | null
  isGuest: boolean
  isMember: boolean
  refreshProfile: () => Promise<void>
  /** Clears local session immediately, then signs out of Supabase. */
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
