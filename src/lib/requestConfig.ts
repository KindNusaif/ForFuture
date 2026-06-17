/** When to show a gentle “still loading” hint (not an error). */
export const LOADING_SLOW_HINT_MS = 5_000

/** When to show retry / recovery UI while a request may still be running. */
export const LOADING_RECOVERY_HINT_MS = 12_000

/** Default Supabase read timeout — generous for real networks. */
export const DEFAULT_REQUEST_TIMEOUT_MS = 30_000

/** Feed + map list queries (rows + enrichment budget). */
export const FEED_REQUEST_TIMEOUT_MS = 45_000

/** Enrichment-only budget after feed rows are already visible. */
export const FEED_ENRICH_TIMEOUT_MS = 25_000

/** Auth bootstrap — do not block the app too aggressively. */
export const AUTH_BOOTSTRAP_TIMEOUT_MS = 15_000

/** Exponential backoff delays between automatic retries (1s → 2s → 4s). */
export const REQUEST_RETRY_DELAYS_MS = [1_000, 2_000, 4_000] as const

/** @deprecated Use REQUEST_RETRY_DELAYS_MS — kept for callers passing explicit delayMs. */
export const REQUEST_AUTO_RETRY_DELAY_MS = REQUEST_RETRY_DELAYS_MS[0]

export const REQUEST_MAX_AUTO_RETRIES = REQUEST_RETRY_DELAYS_MS.length
