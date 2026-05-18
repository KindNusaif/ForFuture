import type { Category, Post } from '../types'
import type { FeedTab } from '../components/FeedTabs'
import type { MovementFilter } from './movements'
import type { ReliefHubFilter } from './reliefHub'

const CACHE_TTL_MS = 2 * 60 * 1000

export interface FeedCacheSnapshot {
  posts: Post[]
  hasMore: boolean
  nextOffset: number
  cachedAt: number
}

const cache = new Map<string, FeedCacheSnapshot>()

export function buildFeedCacheKey(params: {
  feedTab: FeedTab
  movementFilter: MovementFilter
  category: Category | 'All'
  reliefHub: boolean
  reliefSubtype: ReliefHubFilter
  followedIdsKey: string
}): string {
  return [
    params.feedTab,
    params.movementFilter,
    params.category,
    params.reliefHub ? 'hub' : '',
    params.reliefHub ? params.reliefSubtype : '',
    params.feedTab === 'following' ? params.followedIdsKey : '',
  ].join('|')
}

export function getFeedCache(key: string): FeedCacheSnapshot | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
    cache.delete(key)
    return null
  }
  return entry
}

export function setFeedCache(
  key: string,
  snapshot: Pick<FeedCacheSnapshot, 'posts' | 'hasMore' | 'nextOffset'>,
): void {
  cache.set(key, { ...snapshot, cachedAt: Date.now() })
}

export function invalidateFeedCache(feedTab?: FeedTab): void {
  if (!feedTab) {
    cache.clear()
    return
  }
  for (const key of cache.keys()) {
    if (key.startsWith(`${feedTab}|`)) cache.delete(key)
  }
}
