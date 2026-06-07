import { clearCreateMovementDraft } from './createMovementDraft'
import { resetDataSyncState } from './dataSync'
import { invalidateFeedCache } from './feedTabCache'

/** Clears user-specific client cache on logout. Preserves theme and language. */
export function clearUserSessionCache(): void {
  clearCreateMovementDraft()
  invalidateFeedCache()
  resetDataSyncState()
}
