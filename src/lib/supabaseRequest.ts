import {
  REQUEST_AUTO_RETRY_DELAY_MS,
  REQUEST_MAX_AUTO_RETRIES,
} from './requestConfig'

export {
  AUTH_BOOTSTRAP_TIMEOUT_MS,
  DEFAULT_REQUEST_TIMEOUT_MS,
  FEED_ENRICH_TIMEOUT_MS,
  FEED_REQUEST_TIMEOUT_MS,
  LOADING_RECOVERY_HINT_MS,
  LOADING_SLOW_HINT_MS,
} from './requestConfig'

export class RequestTimeoutError extends Error {
  constructor(message = 'This is taking longer than usual. Please check your connection and try again.') {
    super(message)
    this.name = 'RequestTimeoutError'
  }
}

export class RequestAbortedError extends Error {
  constructor(message = 'Request was cancelled.') {
    super(message)
    this.name = 'RequestAbortedError'
  }
}

export function isRequestAborted(error: unknown): boolean {
  return (
    error instanceof RequestAbortedError ||
    (error instanceof DOMException && error.name === 'AbortError') ||
    (error instanceof Error && error.name === 'AbortError')
  )
}

export function isTransientRequestError(error: unknown): boolean {
  if (isRequestAborted(error)) return false
  if (error instanceof RequestTimeoutError) return true
  if (error instanceof TypeError) return true
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()
  return (
    message.includes('failed to fetch') ||
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('timed out') ||
    message.includes('load failed')
  )
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new RequestAbortedError())
      return
    }
    const timer = window.setTimeout(resolve, ms)
    signal?.addEventListener(
      'abort',
      () => {
        window.clearTimeout(timer)
        reject(new RequestAbortedError())
      },
      { once: true },
    )
  })
}

export async function withTimeout<T>(
  promise: PromiseLike<T>,
  ms: number,
  message?: string,
  signal?: AbortSignal,
): Promise<T> {
  if (signal?.aborted) throw new RequestAbortedError()

  let timer: ReturnType<typeof setTimeout> | undefined

  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new RequestTimeoutError(message)), ms)
  })

  const abortPromise =
    signal &&
    new Promise<T>((_, reject) => {
      signal.addEventListener(
        'abort',
        () => reject(new RequestAbortedError()),
        { once: true },
      )
    })

  try {
    const racers: Promise<T>[] = [Promise.resolve(promise), timeoutPromise]
    if (abortPromise) racers.push(abortPromise)
    return await Promise.race(racers)
  } finally {
    if (timer !== undefined) clearTimeout(timer)
  }
}

/** Run an async function with one lightweight retry on transient failures. */
export async function withAutoRetry<T>(
  fn: (attempt: number) => Promise<T>,
  options?: { maxRetries?: number; delayMs?: number; signal?: AbortSignal },
): Promise<T> {
  const maxRetries = options?.maxRetries ?? REQUEST_MAX_AUTO_RETRIES
  const delayMs = options?.delayMs ?? REQUEST_AUTO_RETRY_DELAY_MS
  let lastError: unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (options?.signal?.aborted) throw new RequestAbortedError()
    try {
      return await fn(attempt)
    } catch (error) {
      lastError = error
      if (isRequestAborted(error) || !isTransientRequestError(error) || attempt >= maxRetries) {
        throw error
      }
      await sleep(delayMs, options?.signal)
    }
  }

  throw lastError
}

/** Split large `.in()` lists to stay within PostgREST limits */
export function chunkIds<T>(items: T[], size = 80): T[][] {
  if (items.length === 0) return []
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}
