import { enhanceSupabaseError, isMissingRelation } from './supabaseErrors'
import { requireSupabase } from './supabase'
import { isPollMovement } from './movements'
import { chunkIds, DEFAULT_REQUEST_TIMEOUT_MS, withTimeout } from './supabaseRequest'
import type { PollOption, PollVoteState, Post } from '../types'

export const POLL_OPTION_MIN = 2
export const POLL_OPTION_MAX = 5

type PostRow = Omit<Post, 'support_count' | 'supported_by_me' | 'poll'>

function withPercentages(options: PollOption[], totalVotes: number): PollOption[] {
  return options.map((o) => ({
    ...o,
    percentage:
      totalVotes > 0 ? Math.round((o.vote_count / totalVotes) * 100) : 0,
  }))
}

export async function insertPollOptions(postId: string, optionTexts: string[]): Promise<void> {
  const client = requireSupabase()
  const rows = optionTexts.map((text, index) => ({
    post_id: postId,
    option_text: text.trim(),
    sort_order: index,
  }))

  const { error } = await withTimeout(
    client.from('poll_options').insert(rows),
    DEFAULT_REQUEST_TIMEOUT_MS,
  )
  if (error) throw enhanceSupabaseError(error)
}

async function fetchPollOptionsChunk(
  postIds: string[],
): Promise<{ id: string; post_id: string; option_text: string; sort_order: number; vote_count: number }[]> {
  const client = requireSupabase()
  const { data: options, error: optionsError } = await client
    .from('poll_options')
    .select('id, post_id, option_text, sort_order, vote_count')
    .in('post_id', postIds)
    .order('sort_order', { ascending: true })

  if (optionsError) {
    if (isMissingRelation(optionsError)) return []
    throw enhanceSupabaseError(optionsError)
  }

  return options ?? []
}

async function fetchMyVotesChunk(
  postIds: string[],
  viewerUserId: string,
): Promise<{ post_id: string; option_id: string }[]> {
  const client = requireSupabase()
  const { data: votes, error: votesError } = await client
    .from('poll_votes')
    .select('post_id, option_id')
    .in('post_id', postIds)
    .eq('voter_user_id', viewerUserId)

  if (votesError) {
    if (isMissingRelation(votesError)) return []
    throw enhanceSupabaseError(votesError)
  }

  return votes ?? []
}

export async function fetchPollOptionsForPosts(
  postIds: string[],
  viewerUserId?: string,
): Promise<Map<string, PollVoteState>> {
  const result = new Map<string, PollVoteState>()
  if (postIds.length === 0) return result

  const chunks = chunkIds(postIds)

  const optionsLists = await withTimeout(
    Promise.all(chunks.map((chunk) => fetchPollOptionsChunk(chunk))),
    DEFAULT_REQUEST_TIMEOUT_MS,
  )
  const options = optionsLists.flat()

  let myVotes: { post_id: string; option_id: string }[] = []
  if (viewerUserId) {
    const voteLists = await withTimeout(
      Promise.all(chunks.map((chunk) => fetchMyVotesChunk(chunk, viewerUserId))),
      DEFAULT_REQUEST_TIMEOUT_MS,
    )
    myVotes = voteLists.flat()
  }

  const myVoteByPost = new Map(myVotes.map((v) => [v.post_id, v.option_id]))
  const byPost = new Map<string, PollOption[]>()

  for (const row of options) {
    const list = byPost.get(row.post_id) ?? []
    list.push({
      id: row.id,
      post_id: row.post_id,
      option_text: row.option_text,
      sort_order: row.sort_order,
      vote_count: row.vote_count ?? 0,
    })
    byPost.set(row.post_id, list)
  }

  for (const postId of postIds) {
    const opts = byPost.get(postId) ?? []
    const totalVotes = opts.reduce((sum, o) => sum + o.vote_count, 0)
    result.set(postId, {
      options: withPercentages(opts, totalVotes),
      totalVotes,
      myVoteOptionId: myVoteByPost.get(postId) ?? null,
    })
  }

  return result
}

export async function enrichPostsWithPolls<T extends PostRow>(
  posts: T[],
  viewerUserId?: string,
): Promise<(T & { poll?: PollVoteState })[]> {
  const pollPostIds = posts.filter((p) => isPollMovement(p.movement_type)).map((p) => p.id)
  if (pollPostIds.length === 0) return posts

  const pollMap = await fetchPollOptionsForPosts(pollPostIds, viewerUserId)
  return posts.map((post) => {
    if (!isPollMovement(post.movement_type)) return post
    const poll = pollMap.get(post.id)
    return poll ? { ...post, poll } : post
  })
}

export async function castPollVote(
  postId: string,
  optionId: string,
  voterUserId: string,
): Promise<PollVoteState> {
  const client = requireSupabase()

  const { error } = await withTimeout(
    client.from('poll_votes').insert({
      post_id: postId,
      option_id: optionId,
      voter_user_id: voterUserId,
    }),
    DEFAULT_REQUEST_TIMEOUT_MS,
  )

  if (error) {
    if (error.code === '23505') {
      throw new Error('You have already voted on this poll.')
    }
    throw enhanceSupabaseError(error)
  }

  const pollMap = await fetchPollOptionsForPosts([postId], voterUserId)
  const poll = pollMap.get(postId)
  if (!poll) throw new Error('Could not load poll results.')
  return poll
}

export function getTotalPollVotesReceived(
  posts: Pick<Post, 'movement_type' | 'poll'>[],
): number {
  return posts
    .filter((p) => isPollMovement(p.movement_type) && p.poll)
    .reduce((sum, p) => sum + (p.poll?.totalVotes ?? 0), 0)
}
