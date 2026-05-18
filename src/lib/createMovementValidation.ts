import type { MovementFieldValues } from './movementFieldValues'
import { isPetitionMovement } from './petitions'
import { isPollMovement } from './movements'
import {
  hasFieldErrors,
  POST_LIMITS,
  validateCreatePost,
  type CreatePostFieldErrors,
} from './validation'
import type { Category, MovementType, PostingIdentity } from '../types'

export interface CreateMovementFormState {
  title: string
  description: string
  category: Category | ''
  authorName: string
  postingIdentity: PostingIdentity
  movementType: MovementType
  movementFields: MovementFieldValues
  pollOptions?: string[]
}

/** Description sent to API (petition body vs standard description). */
export function resolveCreateDescription(state: CreateMovementFormState): string {
  const { movementType, description, movementFields } = state
  if (isPetitionMovement(movementType)) {
    const issueText = movementFields.petition_issue.trim()
    if (issueText.length >= POST_LIMITS.descriptionMin) return issueText
    const combined = `${issueText}\n\n${movementFields.petition_requested_change.trim()}`.trim()
    return combined.slice(0, POST_LIMITS.descriptionMax)
  }
  const body = description.trim()
  if (body.length >= POST_LIMITS.descriptionMin) return body
  const summary = movementFields.issue_summary.trim()
  if (summary.length >= POST_LIMITS.descriptionMin) return summary
  if (body && summary) return `${summary}\n\n${body}`.slice(0, POST_LIMITS.descriptionMax)
  return body || summary
}

export function validateCreateMovement(
  state: CreateMovementFormState,
  options?: { postingIdentity: PostingIdentity },
): CreatePostFieldErrors {
  const postingIdentity = options?.postingIdentity ?? state.postingIdentity
  const description = resolveCreateDescription({ ...state, postingIdentity })

  return validateCreatePost({
    title: state.title,
    description,
    category: state.category,
    authorName: state.authorName,
    postingIdentity,
    movementType: state.movementType,
    fundraising_goal_amount: state.movementFields.fundraising_goal_amount,
    fundraising_purpose: state.movementFields.fundraising_purpose,
    pollOptions: isPollMovement(state.movementType) ? state.pollOptions : undefined,
    petition_issue: state.movementFields.petition_issue,
    petition_requested_change: state.movementFields.petition_requested_change,
    petition_target_authority: state.movementFields.petition_target_authority,
    petition_support_goal: state.movementFields.petition_support_goal,
    petition_closing_date: state.movementFields.petition_closing_date,
  })
}

export function wizardStepCanContinue(
  step: number,
  state: CreateMovementFormState,
): boolean {
  if (step === 1) {
    return state.title.trim().length >= POST_LIMITS.titleMin
  }
  if (step === 2) {
    if (isPetitionMovement(state.movementType)) return true
    const desc = resolveCreateDescription(state)
    return desc.length >= POST_LIMITS.descriptionMin
  }
  if (step === 3) return true
  if (step === 4) return Boolean(state.category)
  if (step === 5) {
    const errors = validateCreateMovement(state)
    return !hasFieldErrors(errors)
  }
  return false
}
