import { enhanceSupabaseError } from './supabaseErrors'
import { requireSupabase } from './supabase'
import { chunkIds, DEFAULT_REQUEST_TIMEOUT_MS, withTimeout } from './supabaseRequest'
import { isPetitionMovement } from './petitions'
import type { Post } from '../types'

export interface PetitionSignatureRow {
  petition_id: string
  supporter_user_id: string
}

async function fetchSignaturesChunk(petitionIds: string[]): Promise<PetitionSignatureRow[]> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('petition_signatures')
    .select('petition_id, supporter_user_id')
    .in('petition_id', petitionIds)

  if (error) throw enhanceSupabaseError(error)
  return (data ?? []) as PetitionSignatureRow[]
}

export async function fetchPetitionSignaturesForPosts(
  petitionIds: string[],
): Promise<PetitionSignatureRow[]> {
  if (petitionIds.length === 0) return []
  const chunks = chunkIds(petitionIds)
  const results = await withTimeout(
    Promise.all(chunks.map((chunk) => fetchSignaturesChunk(chunk))),
    DEFAULT_REQUEST_TIMEOUT_MS,
  )
  return results.flat()
}

export function attachPetitionSignatureCounts(
  posts: Post[],
  signatures: PetitionSignatureRow[],
  userId?: string,
): Post[] {
  const countMap = new Map<string, number>()
  const mySigned = new Set<string>()

  for (const row of signatures) {
    countMap.set(row.petition_id, (countMap.get(row.petition_id) ?? 0) + 1)
    if (userId && row.supporter_user_id === userId) {
      mySigned.add(row.petition_id)
    }
  }

  return posts.map((post) => {
    if (!isPetitionMovement(post.movement_type)) return post
    return {
      ...post,
      support_count: countMap.get(post.id) ?? 0,
      supported_by_me: mySigned.has(post.id),
    }
  })
}

export async function enrichPostsWithPetitionSignatures(
  posts: Post[],
  userId?: string,
): Promise<Post[]> {
  const petitionIds = posts.filter((p) => isPetitionMovement(p.movement_type)).map((p) => p.id)
  if (petitionIds.length === 0) return posts

  const signatures = await fetchPetitionSignaturesForPosts(petitionIds)
  return attachPetitionSignatureCounts(posts, signatures, userId)
}

export async function signPetition(petitionId: string, userId: string): Promise<void> {
  const client = requireSupabase()
  const { error } = await withTimeout(
    client.from('petition_signatures').insert({
      petition_id: petitionId,
      supporter_user_id: userId,
    }),
    DEFAULT_REQUEST_TIMEOUT_MS,
  )

  if (error) {
    if (error.code === '23505') {
      throw new Error('You have already supported this petition.')
    }
    throw enhanceSupabaseError(error)
  }
}

export async function fetchPetitionIdsSupportedByUser(userId: string): Promise<string[]> {
  const client = requireSupabase()
  const { data, error } = await withTimeout(
    client
      .from('petition_signatures')
      .select('petition_id')
      .eq('supporter_user_id', userId)
      .order('created_at', { ascending: false }),
    DEFAULT_REQUEST_TIMEOUT_MS,
  )

  if (error) throw enhanceSupabaseError(error)
  return (data ?? []).map((row) => (row as { petition_id: string }).petition_id)
}
