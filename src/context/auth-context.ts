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
  /** True while sign-out is in progress (blocks protected UI and member CTAs). */
  loggingOut: boolean
  refreshProfile: () => Promise<void>
  /** Clears local session, then signs out of Supabase. */
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
