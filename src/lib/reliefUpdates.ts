import { requireSupabase } from './supabase'
import { withTimeout, DEFAULT_REQUEST_TIMEOUT_MS } from './supabaseRequest'

export type ReliefUpdateType =
  | 'progress'
  | 'supplies_collected'
  | 'volunteers_confirmed'
  | 'distribution_started'
  | 'distribution_completed'
  | 'impact_report'

export interface ReliefCampaignUpdate {
  id: string
  post_id: string
  author_user_id: string
  update_type: ReliefUpdateType
  title: string
  body: string
  created_at: string
}

export async function fetchReliefCampaignUpdates(postId: string): Promise<ReliefCampaignUpdate[]> {
  const client = requireSupabase()
  const { data, error } = await withTimeout(
    client
      .from('relief_campaign_updates')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: false }),
    DEFAULT_REQUEST_TIMEOUT_MS,
  )
  if (error) throw error
  return (data ?? []) as ReliefCampaignUpdate[]
}

export async function createReliefCampaignUpdate(input: {
  postId: string
  updateType: ReliefUpdateType
  title: string
  body: string
}): Promise<ReliefCampaignUpdate> {
  const client = requireSupabase()
  const {
    data: { user },
  } = await client.auth.getUser()
  if (!user) throw new Error('Sign in required.')

  const { data, error } = await withTimeout(
    client
      .from('relief_campaign_updates')
      .insert({
        post_id: input.postId,
        author_user_id: user.id,
        update_type: input.updateType,
        title: input.title.trim(),
        body: input.body.trim(),
      })
      .select('*')
      .single(),
    DEFAULT_REQUEST_TIMEOUT_MS,
  )
  if (error) throw error
  return data as ReliefCampaignUpdate
}
