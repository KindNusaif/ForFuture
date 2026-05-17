import { requireSupabase } from './supabase'
import { enhanceSupabaseError } from './supabaseErrors'
import { enrichPosts, fetchFeedRowsPage } from './posts'
import { enrichPostsWithActions } from './postActions'
import {
  EMPTY_IMPACT_PULSE,
  fetchImpactPulseDashboard,
  type ImpactPulseDashboard,
} from './impactPulse'
import { DEFAULT_REQUEST_TIMEOUT_MS, FEED_REQUEST_TIMEOUT_MS } from './requestConfig'
import { isRequestAborted, withTimeout } from './supabaseRequest'
import type { Category, MovementType, Post } from '../types'
import { CATEGORIES } from '../types'

const FEED_SOURCE = 'posts_public_safe' as const

const DISCOVER_SCAN_LIMIT = 48
const DISCOVER_POST_COLUMNS =
  'id,title,description,category,movement_type,created_at,author_name,event_date,action_date,volunteer_slots'

export interface DiscoverTrendingItem {
  id: string
  title: string
  category: Category
  movement_type: MovementType
  author_name: string
  created_at: string
  engagement_count: number
}

export interface DiscoverFeaturedItem {
  id: string
  title: string
  category: Category
  movement_type: MovementType
  created_at: string
  engagement_count: number
  event_date?: string | null
  action_date?: string | null
}

export interface DiscoverCategoryCount {
  category: Category
  count: number
}

export interface DiscoverPageData {
  impact: ImpactPulseDashboard
  trending: DiscoverTrendingItem[]
  categoryCounts: DiscoverCategoryCount[]
  featured: {
    volunteer: DiscoverFeaturedItem[]
    civic: DiscoverFeaturedItem[]
    rising: DiscoverFeaturedItem[]
  }
}

export const EMPTY_DISCOVER_PAGE: DiscoverPageData = {
  impact: EMPTY_IMPACT_PULSE,
  trending: [],
  categoryCounts: CATEGORIES.filter((c) => c !== 'Other').map((category) => ({
    category,
    count: 0,
  })),
  featured: { volunteer: [], civic: [], rising: [] },
}

function engagementScore(post: Post): number {
  if (post.movement_type === 'quick_youth_poll' && post.poll) {
    return post.poll.totalVotes ?? 0
  }
  if (post.movement_type === 'youth_petition') {
    return post.support_count ?? 0
  }
  return post.support_count ?? 0
}

function toTrendingItem(post: Post): DiscoverTrendingItem {
  return {
    id: post.id,
    title: post.title,
    category: post.category,
    movement_type: post.movement_type,
    author_name: post.author_name,
    created_at: post.created_at,
    engagement_count: engagementScore(post),
  }
}

function toFeaturedItem(post: Post): DiscoverFeaturedItem {
  return {
    id: post.id,
    title: post.title,
    category: post.category,
    movement_type: post.movement_type,
    created_at: post.created_at,
    engagement_count: engagementScore(post),
    event_date: post.event_date,
    action_date: post.action_date,
  }
}

function rankByEngagement(posts: Post[]): Post[] {
  return [...posts].sort((a, b) => {
    const diff = engagementScore(b) - engagementScore(a)
    if (diff !== 0) return diff
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
}

async function fetchRecentPostsForRanking(signal?: AbortSignal): Promise<Post[]> {
  const { rows } = await withTimeout(
    fetchFeedRowsPage({ limit: DISCOVER_SCAN_LIMIT, offset: 0 }, signal),
    FEED_REQUEST_TIMEOUT_MS,
    undefined,
    signal,
  )
  if (rows.length === 0) return []
  return withTimeout(enrichPosts(rows, undefined, signal), FEED_REQUEST_TIMEOUT_MS, undefined, signal)
}

async function fetchCategoryCountsFromDb(): Promise<DiscoverCategoryCount[]> {
  const client = requireSupabase()
  const { data, error } = await client
    .from(FEED_SOURCE)
    .select('category')
    .limit(500)

  if (error) throw enhanceSupabaseError(error)
  const counts = new Map<Category, number>()
  for (const cat of CATEGORIES) counts.set(cat, 0)
  for (const row of data ?? []) {
    const cat = row.category as Category
    if (CATEGORIES.includes(cat)) {
      counts.set(cat, (counts.get(cat) ?? 0) + 1)
    }
  }
  return CATEGORIES.filter((c) => c !== 'Other').map((category) => ({
    category,
    count: counts.get(category) ?? 0,
  }))
}

function categoryCountsFromImpact(impact: ImpactPulseDashboard): DiscoverCategoryCount[] {
  const map = new Map(impact.categories.map((r) => [r.category, r.count]))
  return CATEGORIES.filter((c) => c !== 'Other').map((category) => ({
    category,
    count: map.get(category) ?? 0,
  }))
}

function buildFeatured(posts: Post[]): DiscoverPageData['featured'] {
  const ranked = rankByEngagement(posts)

  const volunteer = ranked
    .filter((p) => p.movement_type === 'volunteer_drive')
    .sort((a, b) => {
      const aDate = a.event_date ? new Date(`${a.event_date}T12:00:00`).getTime() : Infinity
      const bDate = b.event_date ? new Date(`${b.event_date}T12:00:00`).getTime() : Infinity
      return aDate - bDate
    })
    .slice(0, 4)
    .map(toFeaturedItem)

  const civic = ranked
    .filter((p) => p.movement_type === 'peaceful_civic_action')
    .slice(0, 4)
    .map(toFeaturedItem)

  const rising = ranked
    .filter((p) => ['idea_for_change', 'raise_voice', 'fundraising'].includes(p.movement_type))
    .slice(0, 4)
    .map(toFeaturedItem)

  return { volunteer, civic, rising }
}

/** Lightweight fallback when full enrich is slow — action counts only */
async function fetchTrendingFallback(): Promise<DiscoverTrendingItem[]> {
  const client = requireSupabase()
  const { data, error } = await client
    .from(FEED_SOURCE)
    .select(DISCOVER_POST_COLUMNS)
    .order('created_at', { ascending: false })
    .limit(DISCOVER_SCAN_LIMIT)

  if (error) throw enhanceSupabaseError(error)
  const shells = (data ?? []).map((row) => ({
    ...(row as Omit<Post, 'support_count' | 'supported_by_me'>),
    support_count: 0,
    supported_by_me: false,
  })) as Post[]

  const withActions = await enrichPostsWithActions(shells)
  const ranked = rankByEngagement(withActions).slice(0, 6)
  return ranked.map(toTrendingItem)
}

export async function fetchDiscoverPageData(options?: {
  signal?: AbortSignal
}): Promise<DiscoverPageData> {
  const signal = options?.signal

  let impact = EMPTY_IMPACT_PULSE
  try {
    impact = await withTimeout(
      fetchImpactPulseDashboard({ signal }),
      DEFAULT_REQUEST_TIMEOUT_MS,
      undefined,
      signal,
    )
  } catch (err) {
    if (isRequestAborted(err)) throw err
  }

  let posts: Post[] = []
  let trending: DiscoverTrendingItem[]

  try {
    posts = await fetchRecentPostsForRanking(signal)
    trending = rankByEngagement(posts)
      .filter((p) => engagementScore(p) > 0)
      .slice(0, 6)
      .map(toTrendingItem)

    if (trending.length === 0 && posts.length > 0) {
      trending = rankByEngagement(posts).slice(0, 6).map(toTrendingItem)
    }
  } catch {
    trending = await fetchTrendingFallback()
    if (posts.length === 0) {
      const client = requireSupabase()
      const { data } = await client
        .from(FEED_SOURCE)
        .select(DISCOVER_POST_COLUMNS)
        .order('created_at', { ascending: false })
        .limit(DISCOVER_SCAN_LIMIT)
      posts = (data ?? []).map((row) => ({
        ...(row as Post),
        support_count: 0,
        supported_by_me: false,
      }))
    }
  }

  if (impact.weekly.most_supported && !trending.some((t) => t.id === impact.weekly.most_supported!.id)) {
    const spotlight = impact.weekly.most_supported
    trending = [
      {
        id: spotlight.id,
        title: spotlight.title,
        category: spotlight.category as Category,
        movement_type: spotlight.movement_type,
        author_name: '',
        created_at: new Date().toISOString(),
        engagement_count: spotlight.engagement_count,
      },
      ...trending,
    ].slice(0, 6)
  }

  let categoryCounts: DiscoverCategoryCount[]
  try {
    if (impact.categories.length > 0) {
      categoryCounts = categoryCountsFromImpact(impact)
    } else {
      categoryCounts = await fetchCategoryCountsFromDb()
    }
  } catch {
    categoryCounts = CATEGORIES.filter((c) => c !== 'Other').map((category) => ({
      category,
      count: 0,
    }))
  }

  const featured = posts.length > 0 ? buildFeatured(posts) : { volunteer: [], civic: [], rising: [] }

  return { impact, trending, categoryCounts, featured }
}

/** Never throws except on abort — returns empty sections when data is unavailable. */
export async function fetchDiscoverPageDataSafe(options?: {
  signal?: AbortSignal
}): Promise<DiscoverPageData> {
  try {
    return await fetchDiscoverPageData(options)
  } catch (err) {
    if (isRequestAborted(err)) throw err
    return EMPTY_DISCOVER_PAGE
  }
}

export function movementsFilterUrl(options: {
  category?: Category
  type?: MovementType
}): string {
  const params = new URLSearchParams()
  if (options.category) params.set('category', options.category)
  if (options.type) params.set('type', options.type)
  const q = params.toString()
  return q ? `/movements?${q}` : '/movements'
}
