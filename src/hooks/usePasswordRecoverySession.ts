import { useEffect, useState } from 'react'
import { clearAuthHashFromUrl, parseAuthHashType } from '../lib/auth'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

export type RecoverySessionStatus = 'loading' | 'ready' | 'invalid'

const RECOVERY_WAIT_MS = 10_000

/**
 * Waits for Supabase to establish a PASSWORD_RECOVERY session from the email link hash.
 */
export function usePasswordRecoverySession(): RecoverySessionStatus {
  const [status, setStatus] = useState<RecoverySessionStatus>('loading')

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setStatus('invalid')
      return
    }

    let settled = false
    let timeoutId: number | undefined

    function markReady() {
      if (settled) return
      settled = true
      clearAuthHashFromUrl()
      setStatus('ready')
    }

    function markInvalid() {
      if (settled) return
      settled = true
      setStatus('invalid')
    }

    const hashType = parseAuthHashType()
    const hasRecoveryHash =
      hashType === 'recovery' || window.location.hash.includes('access_token')

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        markReady()
      }
    })

    const client = supabase

    async function verifySession() {
      const { data, error } = await client.auth.getSession()
      if (error) {
        markInvalid()
        return
      }
      if (data.session && (hashType === 'recovery' || hasRecoveryHash)) {
        markReady()
        return
      }
      if (!hasRecoveryHash) {
        markInvalid()
      }
    }

    void verifySession()

    timeoutId = window.setTimeout(() => {
      if (!settled) markInvalid()
    }, RECOVERY_WAIT_MS)

    return () => {
      settled = true
      subscription.unsubscribe()
      if (timeoutId) window.clearTimeout(timeoutId)
    }
  }, [])

  return status
}
