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
export const AUTH_BOOTSTRAP_TIMEOUT_MS = 20_000

/** One automatic retry before surfacing a hard error. */
export const REQUEST_AUTO_RETRY_DELAY_MS = 900

export const REQUEST_MAX_AUTO_RETRIES = 1
