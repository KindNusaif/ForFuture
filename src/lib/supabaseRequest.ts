/** Default timeout for most Supabase reads */
export const DEFAULT_REQUEST_TIMEOUT_MS = 15_000

/** Feed / profile list queries may join enrichments */
export const FEED_REQUEST_TIMEOUT_MS = 20_000

export class RequestTimeoutError extends Error {
  constructor(message = 'Request timed out. Please check your connection and try again.') {
    super(message)
    this.name = 'RequestTimeoutError'
  }
}

export async function withTimeout<T>(
  promise: PromiseLike<T>,
  ms: number,
  message?: string,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined

  try {
    return await Promise.race([
      Promise.resolve(promise),
      new Promise<T>((_, reject) => {
        timer = setTimeout(
          () => reject(new RequestTimeoutError(message)),
          ms,
        )
      }),
    ])
  } finally {
    if (timer !== undefined) clearTimeout(timer)
  }
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
