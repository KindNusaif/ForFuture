import { useEffect, useState } from 'react'
import { clearAuthHashFromUrl, parseAuthHashType } from '../lib/auth'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

export type RecoverySessionStatus = 'loading' | 'ready' | 'invalid'

const RECOVERY_WAIT_MS = 10_000

/**
 * Waits for Supabase to establish a PASSWORD_RECOVERY session from the email link hash.
 */
export function usePasswordRecoverySession(): RecoverySessionStatus {
  const [status, setStatus] = useState<RecoverySessionStatus>(() =>
    !isSupabaseConfigured || !supabase ? 'invalid' : 'loading',
  )

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return

    let settled = false
    const client = supabase

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
    } = client.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        markReady()
      }
    })

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

    const timeoutId = window.setTimeout(() => {
      if (!settled) markInvalid()
    }, RECOVERY_WAIT_MS)

    return () => {
      settled = true
      subscription.unsubscribe()
      window.clearTimeout(timeoutId)
    }
  }, [])

  return status
}
