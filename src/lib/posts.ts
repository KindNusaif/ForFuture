import { getPostAuthorPresentation } from './postIdentity'
import {
  POST_OWN_COLUMNS,
  POST_OWN_COLUMNS_LEGACY,
  POST_PUBLIC_COLUMNS,
  POST_PUBLIC_COLUMNS_LEGACY,
} from './postColumns'
import { enhanceSupabaseError, isMissingColumn, isMissingRelation } from './supabaseErrors'
import { enrichPostsWithPolls, insertPollOptions } from './polls'
import { isPollMovement } from './movements'
import { enrichPostsWithActions, fetchPostActionsForPosts } from './postActions'
import { enrichPostsWithPetitionSignatures } from './petitionSignatures'
import { isPetitionMovement } from './petitions'
import { requireSupabase } from './supabase'
import {
  DEFAULT_REQUEST_TIMEOUT_MS,
  FEED_REQUEST_TIMEOUT_MS,
  withTimeout,
} from './supabaseRequest'
import { formatYouthVoiceLabel } from './youthVoiceId'
import type { Category, CreateMovementInput, MovementType, Post, PostingIdentity } from '../types'

type PostRowBase = Omit<Post, 'support_count' | 'supported_by_me'>

const FEED_SOURCE = 'posts_public_safe' as const

export const DEFAULT_FEED_PAGE_SIZE = 25
export const PROFILE_POSTS_LIMIT = 100

export interface FetchPostsPageParams {
  viewerUserId?: string
  limit?: number
  offset?: number
  movementType?: MovementType
  category?: Category
}

export interface FetchPostsPageResult {
  posts: Post[]
  hasMore: boolean
  nextOffset: number
}

function mapPostRow(
  row: Record<string, unknown>,
  options?: { viewerUserId?: string },
): PostRowBase {
  const postingIdentity = (row.posting_identity as PostingIdentity) ?? 'profile'
  const base: PostRowBase = {
    id: row.id as string,
    user_id: (row.user_id as string | null) ?? null,
    title: row.title as string,
    description: row.description as string,
    category: row.category as Category,
    author_name: row.author_name as string,
    posting_identity: postingIdentity,
    youth_voice_id: (row.youth_voice_id as string | null) ?? null,
    movement_type: (row.movement_type as Post['movement_type']) ?? 'idea_for_change',
    created_at: row.created_at as string,
    proposed_solution: (row.proposed_solution as string | null) ?? null,
    expected_impact: (row.expected_impact as string | null) ?? null,
    issue_summary: (row.issue_summary as string | null) ?? null,
    desired_change: (row.desired_change as string | null) ?? null,
    event_date: (row.event_date as string | null) ?? null,
    event_time: (row.event_time as string | null) ?? null,
    location: (row.location as string | null) ?? null,
    volunteer_slots: row.volunteer_slots != null ? Number(row.volunteer_slots) : null,
    contact_note: (row.contact_note as string | null) ?? null,
    fundraising_goal_amount:
      row.fundraising_goal_amount != null ? Number(row.fundraising_goal_amount) : null,
    fundraising_purpose: (row.fundraising_purpose as string | null) ?? null,
    beneficiary_description: (row.beneficiary_description as string | null) ?? null,
    current_raised_amount:
      row.current_raised_amount != null ? Number(row.current_raised_amount) : 0,
    action_date: (row.action_date as string | null) ?? null,
    action_time: (row.action_time as string | null) ?? null,
    action_location: (row.action_location as string | null) ?? null,
    action_purpose: (row.action_purpose as string | null) ?? null,
    safety_note: (row.safety_note as string | null) ?? null,
    petition_issue: (row.petition_issue as string | null) ?? null,
    petition_requested_change: (row.petition_requested_change as string | null) ?? null,
    petition_target_authority: (row.petition_target_authority as string | null) ?? null,
    petition_support_goal:
      row.petition_support_goal != null ? Number(row.petition_support_goal) : null,
    petition_closing_date: (row.petition_closing_date as string | null) ?? null,
    petition_impact_note: (row.petition_impact_note as string | null) ?? null,
    location_name: (row.location_name as string | null) ?? null,
    latitude: row.latitude != null ? Number(row.latitude) : null,
    longitude: row.longitude != null ? Number(row.longitude) : null,
    is_trusted_campaign: Boolean(row.is_trusted_campaign),
    trusted_campaign_type:
      (row.trusted_campaign_type as Post['trusted_campaign_type']) ?? null,
    trusted_at: (row.trusted_at as string | null) ?? null,
    author_is_verified_organization: Boolean(row.author_is_verified_organization),
    author_organization_verification_type:
      (row.author_organization_verification_type as Post['author_organization_verification_type']) ??
      null,
  }

  return sanitizePostForPublic(base, options)
}

export function sanitizePostForPublic(
  post: PostRowBase,
  options?: { viewerUserId?: string },
): PostRowBase {
  if (post.posting_identity !== 'youth_voice') return post

  const isOwner = Boolean(options?.viewerUserId && post.user_id === options.viewerUserId)
  const { displayName, youthVoiceId } = getPostAuthorPresentation(post)

  return {
    ...post,
    author_name: displayName,
    youth_voice_id: youthVoiceId,
    user_id: isOwner ? post.user_id : null,
    author_is_verified_organization: false,
    author_organization_verification_type: null,
  }
}

function applyFeedFilters<
  Q extends {
    eq: (column: string, value: string) => Q
  },
>(query: Q, params: Pick<FetchPostsPageParams, 'movementType' | 'category'>): Q {
  let q = query
  if (params.movementType) q = q.eq('movement_type', params.movementType)
  if (params.category) q = q.eq('category', params.category)
  return q
}

async function queryPublicFeedRows(
  params: FetchPostsPageParams,
  columns: string,
): Promise<Record<string, unknown>[]> {
  const client = requireSupabase()
  const pageSize = params.limit ?? DEFAULT_FEED_PAGE_SIZE
  const offset = params.offset ?? 0
  const from = offset
  const to = offset + pageSize

  let query = client
    .from(FEED_SOURCE)
    .select(columns)
    .order('created_at', { ascending: false })
    .range(from, to)

  query = applyFeedFilters(query, params)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as unknown as Record<string, unknown>[]
}

/** Paginated public feed — ordered by created_at desc, explicit columns only */
async function fetchPublicFeedRows(params: FetchPostsPageParams): Promise<{
  rows: PostRowBase[]
  hasMore: boolean
}> {
  const pageSize = params.limit ?? DEFAULT_FEED_PAGE_SIZE
  const viewerUserId = params.viewerUserId

  try {
    const raw = await queryPublicFeedRows(params, POST_PUBLIC_COLUMNS)
    const hasMore = raw.length > pageSize
    const slice = raw.slice(0, pageSize)
    return {
      rows: slice.map((row) => mapPostRow(row, { viewerUserId })),
      hasMore,
    }
  } catch (error) {
    if (isMissingRelation(error)) {
      throw enhanceSupabaseError(error)
    }
    if (isMissingColumn(error)) {
      const raw = await queryPublicFeedRows(params, POST_PUBLIC_COLUMNS_LEGACY)
      const hasMore = raw.length > pageSize
      const slice = raw.slice(0, pageSize)
      return {
        rows: slice.map((row) => mapPostRow(row, { viewerUserId })),
        hasMore,
      }
    }
    throw enhanceSupabaseError(error)
  }
}

async function fetchOwnPostRows(userId: string, limit = PROFILE_POSTS_LIMIT): Promise<PostRowBase[]> {
  const client = requireSupabase()

  async function run(columns: string) {
    return client
      .from('posts')
      .select(columns)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
  }

  let { data, error } = await run(POST_OWN_COLUMNS)
  if (error && isMissingColumn(error)) {
    ;({ data, error } = await run(POST_OWN_COLUMNS_LEGACY))
  }

  if (error) throw enhanceSupabaseError(error)
  return (data ?? []).map((row) =>
    mapPostRow(row as unknown as Record<string, unknown>, { viewerUserId: userId }),
  )
}

/** Poll + support enrichment in parallel (avoids sequential round-trips) */
export async function enrichPosts(rows: PostRowBase[], viewerUserId?: string): Promise<Post[]> {
  if (rows.length === 0) return []

  const asPosts = rows as Post[]
  const [withPolls, withSupport, withPetitions] = await Promise.all([
    enrichPostsWithPolls(asPosts, viewerUserId),
    enrichPostsWithActions(asPosts, viewerUserId),
    enrichPostsWithPetitionSignatures(asPosts, viewerUserId),
  ])

  const pollById = new Map(withPolls.map((p) => [p.id, p.poll]))
  const petitionById = new Map(withPetitions.map((p) => [p.id, p]))

  return withSupport.map((p) => {
    const petitionOverlay = petitionById.get(p.id)
    const merged =
      isPetitionMovement(p.movement_type) && petitionOverlay
        ? {
            ...p,
            support_count: petitionOverlay.support_count,
            supported_by_me: petitionOverlay.supported_by_me,
          }
        : p
    return {
      ...merged,
      poll: pollById.get(p.id) ?? merged.poll,
    }
  })
}

export async function fetchPostsPage(params: FetchPostsPageParams = {}): Promise<FetchPostsPageResult> {
  const offset = params.offset ?? 0
  const limit = params.limit ?? DEFAULT_FEED_PAGE_SIZE

  const { rows, hasMore } = await withTimeout(
    fetchPublicFeedRows({ ...params, limit, offset }),
    FEED_REQUEST_TIMEOUT_MS,
  )

  const posts = await withTimeout(enrichPosts(rows, params.viewerUserId), FEED_REQUEST_TIMEOUT_MS)

  return {
    posts,
    hasMore,
    nextOffset: offset + limit,
  }
}

/** First page only — prefer fetchPostsPage for feeds */
export async function fetchPosts(viewerUserId?: string): Promise<Post[]> {
  const { posts } = await fetchPostsPage({ viewerUserId, offset: 0 })
  return posts
}

export async function fetchPostById(
  postId: string,
  viewerUserId?: string,
): Promise<Post | null> {
  const client = requireSupabase()

  const fetchRow = async (columns: string) => {
    const { data, error } = await client
      .from(FEED_SOURCE)
      .select(columns)
      .eq('id', postId)
      .maybeSingle()
    if (error) throw error
    return data
  }

  const row = await withTimeout(
    (async () => {
      try {
        return await fetchRow(POST_PUBLIC_COLUMNS)
      } catch (error) {
        if (isMissingColumn(error)) return await fetchRow(POST_PUBLIC_COLUMNS_LEGACY)
        throw error
      }
    })(),
    DEFAULT_REQUEST_TIMEOUT_MS,
  )

  if (!row) return null

  const mapped = mapPostRow(row as unknown as Record<string, unknown>, { viewerUserId })
  const [post] = await withTimeout(enrichPosts([mapped], viewerUserId), DEFAULT_REQUEST_TIMEOUT_MS)
  return post
}

function buildInsertRow(input: CreateMovementInput): Record<string, unknown> {
  const postingIdentity = input.movementType === 'fundraising' ? 'profile' : input.postingIdentity

  const authorName =
    postingIdentity === 'youth_voice'
      ? formatYouthVoiceLabel(input.youthVoiceId)
      : input.authorName.trim()

  const description =
    isPollMovement(input.movementType) && !input.description.trim()
      ? 'Community poll'
      : input.description.trim()

  const row: Record<string, unknown> = {
    user_id: input.userId,
    title: input.title.trim(),
    description,
    category: input.category,
    author_name: authorName,
    posting_identity: postingIdentity,
    youth_voice_id: postingIdentity === 'youth_voice' ? input.youthVoiceId : null,
    movement_type: input.movementType,
    proposed_solution: null,
    expected_impact: null,
    issue_summary: null,
    desired_change: null,
    event_date: null,
    event_time: null,
    location: null,
    volunteer_slots: null,
    contact_note: null,
    fundraising_goal_amount: null,
    fundraising_purpose: null,
    beneficiary_description: null,
    current_raised_amount: 0,
    action_date: null,
    action_time: null,
    action_location: null,
    action_purpose: null,
    safety_note: null,
    location_name: null,
    latitude: null,
    longitude: null,
  }

  const trim = (v?: string) => (v?.trim() ? v.trim() : null)

  const applyMapLocation = (name?: string) => {
    const locationName = trim(name)
    row.location_name = locationName
    row.latitude = input.latitude ?? null
    row.longitude = input.longitude ?? null
    return locationName
  }

  switch (input.movementType) {
    case 'idea_for_change':
      row.proposed_solution = trim(input.proposed_solution)
      row.expected_impact = trim(input.expected_impact)
      break
    case 'raise_voice':
      row.issue_summary = trim(input.issue_summary)
      row.desired_change = trim(input.desired_change)
      break
    case 'volunteer_drive': {
      row.event_date = trim(input.event_date)
      row.event_time = trim(input.event_time)
      const loc = applyMapLocation(input.location_name ?? input.location)
      row.location = loc
      row.volunteer_slots = input.volunteer_slots ?? null
      row.contact_note = trim(input.contact_note)
      break
    }
    case 'fundraising':
      row.fundraising_goal_amount = input.fundraising_goal_amount ?? null
      row.fundraising_purpose = trim(input.fundraising_purpose)
      row.beneficiary_description = trim(input.beneficiary_description)
      row.current_raised_amount = 0
      break
    case 'peaceful_civic_action': {
      row.action_date = trim(input.action_date)
      row.action_time = trim(input.action_time)
      const loc = applyMapLocation(input.location_name ?? input.action_location)
      row.action_location = loc
      row.action_purpose = trim(input.action_purpose)
      row.safety_note = trim(input.safety_note)
      break
    }
    case 'youth_petition': {
      row.petition_issue = trim(input.petition_issue)
      row.petition_requested_change = trim(input.petition_requested_change)
      row.petition_target_authority = trim(input.petition_target_authority)
      row.petition_support_goal = input.petition_support_goal ?? null
      row.petition_closing_date = trim(input.petition_closing_date)
      row.petition_impact_note = trim(input.petition_impact_note)
      break
    }
  }

  return row
}

export async function createPost(input: CreateMovementInput) {
  const client = requireSupabase()
  const insertRow = buildInsertRow(input)

  async function insertAndSelect(columns: string) {
    return client.from('posts').insert(insertRow).select(columns).single()
  }

  let { data, error } = await insertAndSelect(POST_OWN_COLUMNS)
  if (error && isMissingColumn(error)) {
    ;({ data, error } = await insertAndSelect(POST_OWN_COLUMNS_LEGACY))
  }

  if (error) throw enhanceSupabaseError(error)

  const post = mapPostRow(data as unknown as Record<string, unknown>, {
    viewerUserId: input.userId,
  })

  if (isPollMovement(input.movementType) && input.pollOptions?.length) {
    const options = input.pollOptions.map((o) => o.trim()).filter(Boolean)
    await insertPollOptions(post.id, options)
  }

  return post
}

export async function fetchPostsByUser(userId: string): Promise<Post[]> {
  const rows = await withTimeout(fetchOwnPostRows(userId), FEED_REQUEST_TIMEOUT_MS)
  return enrichPosts(rows, userId)
}

/** Total supports received across a user's posts (lightweight aggregate) */
export async function getTotalSupportForUser(userId: string): Promise<number> {
  const client = requireSupabase()
  const { data: postRows, error: postsError } = await withTimeout(
    client.from('posts').select('id').eq('user_id', userId),
    DEFAULT_REQUEST_TIMEOUT_MS,
  )

  if (postsError) throw enhanceSupabaseError(postsError)
  const ids = (postRows ?? []).map((r: { id: string }) => r.id)
  if (ids.length === 0) return 0

  const actions = await fetchPostActionsForPosts(ids)
  return actions.length
}

export type { CreateMovementInput }
