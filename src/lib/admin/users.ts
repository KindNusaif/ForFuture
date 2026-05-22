import { requireSupabase } from '../supabase'
import type { AdminUser } from './types'

const PAGE_SIZE = 50

function mapProfileRow(row: Record<string, unknown>): AdminUser {
  const isAdmin = Boolean(row.is_admin)
  return {
    id: String(row.id ?? ''),
    displayName: (row.display_name as string | null) ?? null,
    youthVoiceId: (row.youth_voice_id as string | null) ?? null,
    role: isAdmin ? 'admin' : 'user',
    isVerifiedOrganizer: Boolean(row.is_verified_organizer),
    createdAt: (row.created_at as string | null) ?? null,
    status: 'active',
  }
}

/** Lists profiles for admins. Prefers admin_list_profiles RPC; falls back to trust search RPC. */
export async function fetchAdminUsers(options: {
  search?: string
  offset?: number
  limit?: number
}): Promise<AdminUser[]> {
  const client = requireSupabase()
  const search = options.search?.trim() ?? ''
  const limit = options.limit ?? PAGE_SIZE
  const offset = options.offset ?? 0

  const { data, error } = await client.rpc('admin_list_profiles', {
    p_search: search,
    p_limit: limit,
    p_offset: offset,
  })

  if (!error && Array.isArray(data)) {
    return data.map((row) => mapProfileRow(row as Record<string, unknown>))
  }

  const { data: fallback, error: fallbackError } = await client.rpc(
    'admin_search_profiles_for_trust',
    { p_query: search },
  )

  if (fallbackError || !Array.isArray(fallback)) {
    throw fallbackError ?? new Error('Unable to load users')
  }

  return fallback.map((row) =>
    mapProfileRow({
      ...row,
      is_admin: false,
      created_at: null,
    } as Record<string, unknown>),
  )
}
