import { isPollMovement } from './movements'
import { isPetitionMovement } from './petitions'
import { isReliefPost } from './reliefHub'
import type { MovementPanelVariant } from './movementPanel'
import { movementTypeToPanelVariant } from './movementPanel'
import type { Post } from '../types'

export function getMovementSummary(post: Post): string {
  if (isPetitionMovement(post.movement_type) && post.petition_issue?.trim()) {
    return post.petition_issue.trim()
  }
  const desc = post.description?.trim() ?? ''
  if (!desc || desc === 'Community poll') return post.title
  const first = desc.split(/\n/)[0]?.trim() ?? desc
  return first.length > 160 ? `${first.slice(0, 157)}…` : first
}

export function getWhyThisMatters(post: Post): string | null {
  if (isPollMovement(post.movement_type)) return null
  if (isPetitionMovement(post.movement_type)) {
    return post.petition_issue?.trim() || post.description?.trim() || null
  }
  const body = post.description?.trim()
  return body && body !== 'Community poll' ? body : null
}

export function getDesiredOutcome(post: Post): { label: string; value: string } | null {
  switch (post.movement_type) {
    case 'idea_for_change':
      if (post.expected_impact?.trim()) {
        return { label: 'Expected impact', value: post.expected_impact.trim() }
      }
      if (post.proposed_solution?.trim()) {
        return { label: 'Proposed solution', value: post.proposed_solution.trim() }
      }
      return null
    case 'raise_voice':
      if (post.desired_change?.trim()) {
        return { label: 'Desired change', value: post.desired_change.trim() }
      }
      return null
    case 'youth_petition':
      if (post.petition_requested_change?.trim()) {
        return { label: 'Requested change', value: post.petition_requested_change.trim() }
      }
      return null
    case 'fundraising':
      if (post.fundraising_purpose?.trim()) {
        return { label: 'Purpose', value: post.fundraising_purpose.trim() }
      }
      return null
    case 'peaceful_civic_action':
      if (post.action_purpose?.trim()) {
        return { label: 'Action purpose', value: post.action_purpose.trim() }
      }
      return null
    case 'volunteer_drive':
      if (post.contact_note?.trim()) {
        return { label: 'How to help', value: post.contact_note.trim() }
      }
      return null
    default:
      return null
  }
}

export function getMovementLocationLabel(post: Post): string | null {
  if (isReliefPost(post)) {
    return (
      post.collection_location?.trim() ||
      post.hospital_or_organizer?.trim() ||
      post.location_name?.trim() ||
      post.location?.trim() ||
      null
    )
  }
  return (
    post.location_name?.trim() ||
    post.action_location?.trim() ||
    post.location?.trim() ||
    null
  )
}

export function detailPanelVariant(post: Post): MovementPanelVariant {
  return movementTypeToPanelVariant(post.movement_type)
}
