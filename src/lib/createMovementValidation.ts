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
  typeExplicitlyChosen?: boolean
  goodFaithConfirmed?: boolean
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

  const parts = [
    movementFields.issue_summary.trim(),
    description.trim(),
    movementFields.expected_impact.trim()
      ? `Why it matters: ${movementFields.expected_impact.trim()}`
      : '',
    movementFields.desired_change.trim()
      ? `Desired change: ${movementFields.desired_change.trim()}`
      : '',
  ].filter(Boolean)

  const combined = parts.join('\n\n').slice(0, POST_LIMITS.descriptionMax)
  if (combined.length >= POST_LIMITS.descriptionMin) return combined

  const body = description.trim()
  if (body.length >= POST_LIMITS.descriptionMin) return body
  const summary = movementFields.issue_summary.trim()
  if (summary.length >= POST_LIMITS.descriptionMin) return summary
  return body || summary || combined
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

function storyStepComplete(state: CreateMovementFormState): boolean {
  if (state.title.trim().length < POST_LIMITS.titleMin) return false
  if (isPetitionMovement(state.movementType)) return true
  return resolveCreateDescription(state).length >= POST_LIMITS.descriptionMin
}

function typeDetailsStepComplete(state: CreateMovementFormState): boolean {
  const { movementType, movementFields } = state
  if (isPetitionMovement(movementType)) {
    return Boolean(
      movementFields.petition_issue.trim() && movementFields.petition_requested_change.trim(),
    )
  }
  if (movementType === 'fundraising') {
    return Boolean(
      movementFields.fundraising_purpose.trim() && movementFields.fundraising_goal_amount.trim(),
    )
  }
  if (movementType === 'volunteer_drive') {
    return Boolean(movementFields.event_date.trim() && movementFields.location.trim())
  }
  if (movementType === 'peaceful_civic_action') {
    return Boolean(movementFields.action_purpose.trim())
  }
  if (movementType === 'idea_for_change') {
    return Boolean(movementFields.proposed_solution.trim())
  }
  if (movementType === 'raise_voice') return true
  return true
}

export function wizardStepCanContinue(step: number, state: CreateMovementFormState): boolean {
  switch (step) {
    case 1:
      return state.typeExplicitlyChosen === true
    case 2:
      return Boolean(state.category)
    case 3:
      return storyStepComplete(state)
    case 4:
      return typeDetailsStepComplete(state)
    case 5:
      return state.goodFaithConfirmed === true
    case 6: {
      const errors = validateCreateMovement(state)
      return !hasFieldErrors(errors) && state.goodFaithConfirmed === true
    }
    default:
      return false
  }
}

export function wizardStepFieldErrors(
  step: number,
  state: CreateMovementFormState,
  options?: { postingIdentity: PostingIdentity },
): CreatePostFieldErrors {
  const all = validateCreateMovement(state, options)
  const out: CreatePostFieldErrors = {}

  if (step === 2 && all.category) out.category = all.category
  if (step === 3) {
    if (all.title) out.title = all.title
    if (all.description) out.description = all.description
  }
  if (step === 4) {
    if (all.petition_issue) out.petition_issue = all.petition_issue
    if (all.petition_requested_change) out.petition_requested_change = all.petition_requested_change
    if (all.fundraising_purpose) out.fundraising_purpose = all.fundraising_purpose
    if (all.fundraising_goal_amount) out.fundraising_goal_amount = all.fundraising_goal_amount
  }
  if (step === 6) return all
  return out
}
