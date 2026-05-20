import { enhanceSupabaseError, isMissingRelation } from './supabaseErrors'
import { requireSupabase } from './supabase'
import { DEFAULT_REQUEST_TIMEOUT_MS, withTimeout } from './supabaseRequest'

export type NotificationType =
  | 'movement_update'
  | 'petition_milestone'
  | 'movement_new_supporter'
  | 'volunteer_interest'
  | 'movement_milestone'

export interface AppNotification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  entity_type: 'movement' | 'petition' | 'poll'
  entity_id: string | null
  is_read: boolean
  created_at: string
}

const TABLE = 'notifications'

export async function fetchNotifications(
  userId: string,
  limit = 30,
): Promise<AppNotification[]> {
  const client = requireSupabase()
  try {
    const { data, error } = await withTimeout(
      client
        .from(TABLE)
        .select('id, user_id, type, title, message, entity_type, entity_id, is_read, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit),
      DEFAULT_REQUEST_TIMEOUT_MS,
    )
    if (error) throw error
    return (data ?? []) as AppNotification[]
  } catch (err) {
    if (isMissingRelation(err)) return []
    throw enhanceSupabaseError(err)
  }
}

export async function markNotificationRead(userId: string, id: string): Promise<void> {
  const client = requireSupabase()
  const { error } = await withTimeout(
    client.from(TABLE).update({ is_read: true }).eq('id', id).eq('user_id', userId),
    DEFAULT_REQUEST_TIMEOUT_MS,
  )
  if (error) {
    if (isMissingRelation(error)) return
    throw enhanceSupabaseError(error)
  }
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const client = requireSupabase()
  const { error } = await withTimeout(
    client.from(TABLE).update({ is_read: true }).eq('user_id', userId).eq('is_read', false),
    DEFAULT_REQUEST_TIMEOUT_MS,
  )
  if (error) {
    if (isMissingRelation(error)) return
    throw enhanceSupabaseError(error)
  }
}

export function notificationHref(
  n: AppNotification,
  mode: 'member' | 'guest' = 'member',
): string | null {
  if (!n.entity_id) return null
  const base = mode === 'member' ? '/feed' : '/explore'
  return `${base}/${n.entity_id}`
}
