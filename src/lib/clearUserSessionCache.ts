import { clearCreateMovementDraft } from './createMovementDraft'

/** Clears user-specific client cache on logout. Preserves theme and language. */
export function clearUserSessionCache(): void {
  clearCreateMovementDraft()
}
