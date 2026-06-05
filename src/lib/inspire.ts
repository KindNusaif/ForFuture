import { notifyInspireChanged } from './dataSync'
import { enhanceSupabaseError, isMissingRelation } from './supabaseErrors'
import { requireSupabase } from './supabase'
import { DEFAULT_REQUEST_TIMEOUT_MS, withTimeout } from './supabaseRequest'
import type {
  CreateInspirePostInput,
  InspireCategory,
  InspirePost,
  UpdateInspirePostInput,
} from '../types/inspire'

const TABLE = 'inspire_posts'
const PAGE_SIZE = 16

const SELECT_COLUMNS =
  'id, user_id, category, title, body, field_data, could_become_movement, status, created_at, updated_at'

type InspireRow = Record<string, unknown>

function mapInspireRow(
  row: InspireRow,
  extras?: Partial<Pick<InspirePost, 'author_display_name' | 'author_avatar_url' | 'comment_count' | 'saved_by_me'>>,
): InspirePost {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    category: row.category as InspireCategory,
    title: row.title as string,
    body: row.body as string,
    field_data: (row.field_data as InspirePost['field_data']) ?? {},
    could_become_movement: Boolean(row.could_become_movement),
    status: row.status as InspirePost['status'],
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    ...extras,
  }
}

async function attachAuthors(rows: InspireRow[]): Promise<InspirePost[]> {
  if (rows.length === 0) return []
  const client = requireSupabase()
  const userIds = [...new Set(rows.map((r) => r.user_id as string))]
  const { data: profiles } = await withTimeout(
    client.from('profiles').select('id, display_name, avatar_url').in('id', userIds),
    DEFAULT_REQUEST_TIMEOUT_MS,
  )
  const byId = new Map(
    (profiles ?? []).map((p) => [
      p.id as string,
      { display_name: p.display_name as string, avatar_url: p.avatar_url as string | null },
    ]),
  )
  return rows.map((row) => {
    const profile = byId.get(row.user_id as string)
    return mapInspireRow(row, {
      author_display_name: profile?.display_name?.trim() || 'Community member',
      author_avatar_url: profile?.avatar_url ?? null,
    })
  })
}

export interface FetchInspirePageParams {
  category?: InspireCategory
  userId?: string
  viewerUserId?: string
  offset?: number
  limit?: number
}

export interface FetchInspirePageResult {
  posts: InspirePost[]
  hasMore: boolean
  nextOffset: number
}

export async function fetchInspirePostsPage(
  params: FetchInspirePageParams = {},
): Promise<FetchInspirePageResult> {
  const client = requireSupabase()
  const offset = params.offset ?? 0
  const limit = params.limit ?? PAGE_SIZE

  try {
    let query = client
      .from(TABLE)
      .select(SELECT_COLUMNS)
      .eq('status', 'visible')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (params.category) query = query.eq('category', params.category)
    if (params.userId) query = query.eq('user_id', params.userId)

    const { data, error } = await withTimeout(query, DEFAULT_REQUEST_TIMEOUT_MS)
    if (error) throw error

    const rows = (data ?? []) as InspireRow[]
    const posts = await attachAuthors(rows)
    const hasMore = rows.length === limit
    return { posts, hasMore, nextOffset: offset + limit }
  } catch (err) {
    if (isMissingRelation(err)) return { posts: [], hasMore: false, nextOffset: 0 }
    throw enhanceSupabaseError(err)
  }
}

export async function fetchInspirePostById(
  id: string,
  viewerUserId?: string,
): Promise<InspirePost | null> {
  const client = requireSupabase()
  try {
    const { data, error } = await withTimeout(
      client.from(TABLE).select(SELECT_COLUMNS).eq('id', id).eq('status', 'visible').maybeSingle(),
      DEFAULT_REQUEST_TIMEOUT_MS,
    )
    if (error) throw error
    if (!data) return null

    const [post] = await attachAuthors([data as InspireRow])
    if (viewerUserId) {
      const saved = await isInspirePostSaved(viewerUserId, id)
      return { ...post, saved_by_me: saved }
    }
    return post
  } catch (err) {
    if (isMissingRelation(err)) return null
    throw enhanceSupabaseError(err)
  }
}

export async function createInspirePost(
  userId: string,
  input: CreateInspirePostInput,
): Promise<InspirePost> {
  const client = requireSupabase()
  const { data, error } = await withTimeout(
    client
      .from(TABLE)
      .insert({
        user_id: userId,
        category: input.category,
        title: input.title.trim(),
        body: input.body.trim(),
        field_data: input.field_data,
        could_become_movement: input.could_become_movement ?? false,
      })
      .select(SELECT_COLUMNS)
      .single(),
    DEFAULT_REQUEST_TIMEOUT_MS,
  )
  if (error) throw enhanceSupabaseError(error)
  const [post] = await attachAuthors([data as InspireRow])
  notifyInspireChanged()
  return post
}

export async function updateInspirePost(
  postId: string,
  userId: string,
  input: UpdateInspirePostInput,
): Promise<InspirePost> {
  const client = requireSupabase()
  const patch: Record<string, unknown> = {}
  if (input.title !== undefined) patch.title = input.title.trim()
  if (input.body !== undefined) patch.body = input.body.trim()
  if (input.field_data !== undefined) patch.field_data = input.field_data
  if (input.could_become_movement !== undefined) patch.could_become_movement = input.could_become_movement

  const { data, error } = await withTimeout(
    client.from(TABLE).update(patch).eq('id', postId).eq('user_id', userId).select(SELECT_COLUMNS).single(),
    DEFAULT_REQUEST_TIMEOUT_MS,
  )
  if (error) throw enhanceSupabaseError(error)
  const [post] = await attachAuthors([data as InspireRow])
  notifyInspireChanged()
  return post
}

export async function deleteInspirePost(postId: string, userId: string): Promise<void> {
  const client = requireSupabase()
  const { error } = await withTimeout(
    client.from(TABLE).delete().eq('id', postId).eq('user_id', userId),
    DEFAULT_REQUEST_TIMEOUT_MS,
  )
  if (error) throw enhanceSupabaseError(error)
  notifyInspireChanged()
}

export function getInspireExcerpt(body: string, maxLen = 160): string {
  const first = body.split(/\n\n/)[0]?.trim() ?? body.trim()
  if (first.length <= maxLen) return first
  return `${first.slice(0, maxLen - 1)}…`
}

async function isInspirePostSaved(userId: string, postId: string): Promise<boolean> {
  const client = requireSupabase()
  try {
    const { data, error } = await withTimeout(
      client
        .from('inspire_saved')
        .select('id')
        .eq('user_id', userId)
        .eq('inspire_post_id', postId)
        .maybeSingle(),
      DEFAULT_REQUEST_TIMEOUT_MS,
    )
    if (error) throw error
    return Boolean(data)
  } catch (err) {
    if (isMissingRelation(err)) return false
    throw enhanceSupabaseError(err)
  }
}

export async function fetchSavedInspireIds(userId: string): Promise<Set<string>> {
  const client = requireSupabase()
  try {
    const { data, error } = await withTimeout(
      client.from('inspire_saved').select('inspire_post_id').eq('user_id', userId),
      DEFAULT_REQUEST_TIMEOUT_MS,
    )
    if (error) throw error
    return new Set((data ?? []).map((r) => (r as { inspire_post_id: string }).inspire_post_id))
  } catch (err) {
    if (isMissingRelation(err)) return new Set()
    throw enhanceSupabaseError(err)
  }
}

export async function toggleInspireSaved(
  userId: string,
  postId: string,
  currentlySaved: boolean,
): Promise<boolean> {
  const client = requireSupabase()
  if (currentlySaved) {
    const { error } = await withTimeout(
      client.from('inspire_saved').delete().eq('user_id', userId).eq('inspire_post_id', postId),
      DEFAULT_REQUEST_TIMEOUT_MS,
    )
    if (error) throw enhanceSupabaseError(error)
    return false
  }
  const { error } = await withTimeout(
    client.from('inspire_saved').insert({ user_id: userId, inspire_post_id: postId }),
    DEFAULT_REQUEST_TIMEOUT_MS,
  )
  if (error) throw enhanceSupabaseError(error)
  return true
}
