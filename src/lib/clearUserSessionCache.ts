import { clearCreateMovementDraft } from './createMovementDraft'
import { resetDataSyncState } from './dataSync'
import { invalidateFeedCache } from './feedTabCache'
import { teardownRealtimeSyncBridge } from './realtimeSyncBridge'
import { isSupabaseConfigured, supabase } from './supabase'

const GUEST_BANNER_SESSION_KEY = 'forfuture-guest-banner-dismissed'

/** Clears user-specific client cache on logout. Preserves theme and language. */
export function clearUserSessionCache(): void {
  clearCreateMovementDraft()
  invalidateFeedCache()
  resetDataSyncState()
  teardownRealtimeSyncBridge()

  if (isSupabaseConfigured && supabase) {
    supabase.removeAllChannels()
  }

  try {
    sessionStorage.removeItem(GUEST_BANNER_SESSION_KEY)
  } catch {
    /* ignore storage errors */
  }
}
