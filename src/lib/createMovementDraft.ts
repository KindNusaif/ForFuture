import type { MovementFieldValues } from './movementFieldValues'
import type { MapLocation } from './googleMaps'
import { resolveCreateDescription, type CreateMovementFormState } from './createMovementValidation'
import type { Category, MovementType, Post, PostingIdentity } from '../types'

export const CREATE_MOVEMENT_DRAFT_KEY = 'ff-create-movement-draft'

export interface CreateMovementDraft {
  wizardStep: number
  movementType: MovementType
  title: string
  description: string
  category: Category | ''
  postingIdentity: PostingIdentity
  authorNameOverride: string | null
  movementFields: MovementFieldValues
  mapLocation: MapLocation
  typeExplicitlyChosen?: boolean
  goodFaithConfirmed?: boolean
}

function isMovementFieldValues(value: unknown): value is MovementFieldValues {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as MovementFieldValues).issue_summary === 'string'
  )
}

function readDraftRaw(): string | null {
  try {
    return localStorage.getItem(CREATE_MOVEMENT_DRAFT_KEY) ?? sessionStorage.getItem(CREATE_MOVEMENT_DRAFT_KEY)
  } catch {
    return null
  }
}

export function loadCreateMovementDraft(): CreateMovementDraft | null {
  try {
    const raw = readDraftRaw()
    if (!raw) return null
    const parsed = JSON.parse(raw) as CreateMovementDraft
    if (!isMovementFieldValues(parsed.movementFields)) {
      clearCreateMovementDraft()
      return null
    }
    const step = Number(parsed.wizardStep)
    if (!Number.isFinite(step) || step < 1 || step > 6) {
      parsed.wizardStep = 1
    }
    return parsed
  } catch {
    clearCreateMovementDraft()
    return null
  }
}

export function saveCreateMovementDraft(draft: CreateMovementDraft): void {
  try {
    const json = JSON.stringify(draft)
    localStorage.setItem(CREATE_MOVEMENT_DRAFT_KEY, json)
    sessionStorage.setItem(CREATE_MOVEMENT_DRAFT_KEY, json)
  } catch {
    /* ignore quota */
  }
}

export function clearCreateMovementDraft(): void {
  try {
    localStorage.removeItem(CREATE_MOVEMENT_DRAFT_KEY)
    sessionStorage.removeItem(CREATE_MOVEMENT_DRAFT_KEY)
  } catch {
    /* ignore */
  }
}

export function buildCreatePreviewPost(input: {
  title: string
  description: string
  category: Category | ''
  authorName: string
  postingIdentity: PostingIdentity
  youthVoiceId: string | null
  movementType: MovementType
  movementFields: MovementFieldValues
  userId: string
}): Post | null {
  if (!input.title.trim() || !input.category) return null
  const formState: CreateMovementFormState = {
    title: input.title,
    description: input.description,
    category: input.category,
    authorName: input.authorName,
    postingIdentity: input.postingIdentity,
    movementType: input.movementType,
    movementFields: input.movementFields,
  }
  const resolvedDescription = resolveCreateDescription(formState)
  if (resolvedDescription.length < 1) return null
  const now = new Date().toISOString()
  return {
    id: 'preview',
    user_id: input.userId,
    title: input.title.trim(),
    description: resolvedDescription,
    category: input.category as Category,
    author_name: input.authorName.trim() || 'You',
    posting_identity: input.postingIdentity,
    youth_voice_id: input.youthVoiceId,
    movement_type: input.movementType,
    created_at: now,
    support_count: 0,
    issue_summary: input.movementFields.issue_summary || null,
    proposed_solution: input.movementFields.proposed_solution || null,
    expected_impact: input.movementFields.expected_impact || null,
    desired_change: input.movementFields.desired_change || null,
    petition_issue: input.movementFields.petition_issue || null,
    petition_requested_change: input.movementFields.petition_requested_change || null,
    petition_target_authority: input.movementFields.petition_target_authority || null,
    petition_support_goal: input.movementFields.petition_support_goal
      ? parseInt(input.movementFields.petition_support_goal, 10)
      : null,
    event_date: input.movementFields.event_date || null,
    event_time: input.movementFields.event_time || null,
    location: input.movementFields.location || null,
    volunteer_slots: input.movementFields.volunteer_slots
      ? parseInt(input.movementFields.volunteer_slots, 10)
      : null,
    fundraising_goal_amount: input.movementFields.fundraising_goal_amount
      ? parseFloat(input.movementFields.fundraising_goal_amount)
      : null,
    fundraising_purpose: input.movementFields.fundraising_purpose || null,
    beneficiary_description: input.movementFields.beneficiary_description || null,
  }
}
