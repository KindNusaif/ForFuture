import { POST_PUBLIC_COLUMNS } from '../postColumns'
import { requireSupabase } from '../supabase'
import type { AdminContentItem } from './types'

const PAGE_SIZE = 50

function mapPostRow(row: Record<string, unknown>): AdminContentItem {
  return {
    id: String(row.id ?? ''),
    title: String(row.title ?? 'Untitled'),
    description: String(row.description ?? ''),
    movementType: String(row.movement_type ?? 'unknown'),
    category: (row.category as string | null) ?? null,
    authorName: String(row.author_name ?? 'Unknown'),
    postingIdentity: String(row.posting_identity ?? 'unknown'),
    publicationStatus: (row.publication_status as string | null) ?? null,
    createdAt: String(row.created_at ?? ''),
  }
}

export async function fetchAdminContent(options: {
  search?: string
  movementType?: string
  offset?: number
  limit?: number
}): Promise<AdminContentItem[]> {
  const client = requireSupabase()
  const limit = options.limit ?? PAGE_SIZE
  const offset = options.offset ?? 0

  let query = client
    .from('posts_public_safe')
    .select(POST_PUBLIC_COLUMNS)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (options.movementType && options.movementType !== 'all') {
    query = query.eq('movement_type', options.movementType)
  }

  const search = options.search?.trim()
  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,author_name.ilike.%${search}%`)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return (data ?? []).map((row) => mapPostRow(row as unknown as Record<string, unknown>))
}
