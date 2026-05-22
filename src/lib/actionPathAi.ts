import { FunctionsHttpError, FunctionsRelayError } from '@supabase/supabase-js'
import type { MovementType } from '../types'
import type { ReliefCreateSubtype } from './reliefHub'
import { requireSupabase } from './supabase'
import {
  ACTIONPATH_INPUT_MAX,
  validateActionPathInput,
  type ActionPathValidationReason,
} from './actionPathValidation'

export { ACTIONPATH_INPUT_MIN, ACTIONPATH_INPUT_MAX } from './actionPathValidation'
export {
  isActionPathInputValid,
  validateActionPathInput,
  type ActionPathValidationReason,
} from './actionPathValidation'

export const ACTIONPATH_REQUEST_TIMEOUT_MS = 45_000

/** Public categories from the Edge Function (user-facing) */
export type ActionPathRecommendedType =
  | 'petition'
  | 'youth_voice'
  | 'volunteer_drive'
  | 'poll'
  | 'relief_campaign'

const RECOMMENDED_TYPES: readonly ActionPathRecommendedType[] = [
  'petition',
  'youth_voice',
  'volunteer_drive',
  'poll',
  'relief_campaign',
]

const TYPE_TO_MOVEMENT: Record<ActionPathRecommendedType, MovementType> = {
  petition: 'youth_petition',
  youth_voice: 'raise_voice',
  volunteer_drive: 'volunteer_drive',
  poll: 'quick_youth_poll',
  relief_campaign: 'donation_relief',
}

const MOVEMENT_TYPES: readonly MovementType[] = [
  'idea_for_change',
  'raise_voice',
  'youth_petition',
  'quick_youth_poll',
  'volunteer_drive',
  'donation_relief',
  'fundraising',
  'peaceful_civic_action',
]

export interface ActionPathSuggestion {
  recommendedType: ActionPathRecommendedType
  suggestedTitle: string
  refinedSummary: string
  whyItMatters: string
  nextSteps: string[]
  recommended_movement_type: MovementType
  recommendation_reason: string
  improved_title: string
  improved_description: string
  suggested_action_steps: string[]
  suggested_fields: Record<string, string>
  safety_note?: string
}

export interface ActionPathApplyResult {
  movementType: MovementType
  title: string
  description: string
  pollOptions?: string[]
  movementFieldUpdates: Partial<
    import('./movementFieldValues').MovementFieldValues
  >
  reliefRedirect?: {
    subtype: ReliefCreateSubtype
    title: string
    description: string
    reliefHints: Partial<Record<string, string>>
  }
}

export type ActionPathErrorCode =
  | 'invalid_input'
  | 'auth'
  | 'rate_limit'
  | 'timeout'
  | 'network'
  | 'unavailable'
  | 'malformed'
  | 'api'
  | 'generic'

export class ActionPathAiError extends Error {
  readonly code: ActionPathErrorCode
  readonly retryAfterSec?: number

  constructor(
    message: string,
    code: ActionPathErrorCode = 'generic',
    retryAfterSec?: number,
  ) {
    super(message)
    this.name = 'ActionPathAiError'
    this.code = code
    this.retryAfterSec = retryAfterSec
  }
}

type EdgePayload = {
  success?: boolean
  message?: string
  code?: string
  data?: ActionPathSuggestion
  suggestion?: ActionPathSuggestion
  error?: string
  retry_after_sec?: number
}

function isMovementType(value: string): value is MovementType {
  return (MOVEMENT_TYPES as readonly string[]).includes(value)
}

function mapEdgeCode(code: string | undefined, message: string): ActionPathErrorCode {
  if (code === 'invalid_input' || code === 'auth') return code
  if (code === 'rate_limit') return 'rate_limit'
  if (code === 'unavailable' || code === 'config') return 'unavailable'
  if (code === 'malformed') return 'malformed'
  if (code === 'api') return 'api'

  const lower = message.toLowerCase()
  if (lower.includes('sign in')) return 'auth'
  if (lower.includes('busy') || lower.includes('wait')) return 'rate_limit'
  if (lower.includes('not available') || lower.includes('temporarily')) return 'unavailable'
  if (lower.includes('at least') || lower.includes('characters') || lower.includes('unclear')) {
    return 'invalid_input'
  }
  return 'api'
}

function userMessageForCode(code: ActionPathErrorCode, fallback: string): string {
  switch (code) {
    case 'invalid_input':
      return 'Please describe a real community issue or idea before generating an Action Path.'
    case 'auth':
      return 'Sign in to use ActionPath AI.'
    case 'rate_limit':
      return 'ActionPath AI is busy at the moment. Please try again shortly.'
    case 'timeout':
      return 'This is taking longer than expected. Please try again.'
    case 'network':
    case 'unavailable':
      return 'ActionPath AI is temporarily unavailable. Please try again shortly.'
    case 'malformed':
      return "We couldn't read the AI suggestion properly. Please try again."
    case 'api':
      return "We couldn't generate a suggestion right now. Please try again."
    default:
      return fallback
  }
}

function throwFromEdgePayload(payload: EdgePayload): never {
  const message =
    payload.message ||
    payload.error ||
    "We couldn't generate a suggestion right now. Please try again."
  const code = mapEdgeCode(payload.code, message)
  throw new ActionPathAiError(
    userMessageForCode(code, message),
    code,
    payload.retry_after_sec,
  )
}

function normalizeSuggestion(raw: Record<string, unknown>): ActionPathSuggestion | null {
  const recommendedType = raw.recommendedType
  const suggestedTitle = raw.suggestedTitle ?? raw.improved_title
  const refinedSummary = raw.refinedSummary ?? raw.improved_description
  const whyItMatters = raw.whyItMatters ?? raw.recommendation_reason
  const nextStepsRaw = raw.nextSteps ?? raw.suggested_action_steps

  let movementType = raw.recommended_movement_type
  if (
    typeof recommendedType === 'string' &&
    RECOMMENDED_TYPES.includes(recommendedType as ActionPathRecommendedType)
  ) {
    movementType = TYPE_TO_MOVEMENT[recommendedType as ActionPathRecommendedType]
  }

  if (typeof movementType !== 'string' || !isMovementType(movementType)) return null
  if (typeof suggestedTitle !== 'string' || !suggestedTitle.trim()) return null
  if (typeof refinedSummary !== 'string' || !refinedSummary.trim()) return null
  if (typeof whyItMatters !== 'string' || !whyItMatters.trim()) return null
  if (!Array.isArray(nextStepsRaw) || nextStepsRaw.length < 3) return null

  const nextSteps = nextStepsRaw
    .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
    .map((s) => s.trim())
    .slice(0, 5)
  if (nextSteps.length < 3) return null

  const fieldsRaw = raw.suggested_fields
  const suggested_fields: Record<string, string> = {}
  if (fieldsRaw && typeof fieldsRaw === 'object') {
    for (const [key, value] of Object.entries(fieldsRaw as Record<string, unknown>)) {
      if (typeof value === 'string' && value.trim()) suggested_fields[key] = value.trim()
    }
  }

  const publicType =
    typeof recommendedType === 'string' &&
    RECOMMENDED_TYPES.includes(recommendedType as ActionPathRecommendedType)
      ? (recommendedType as ActionPathRecommendedType)
      : (Object.entries(TYPE_TO_MOVEMENT).find(([, m]) => m === movementType)?.[0] as
          | ActionPathRecommendedType
          | undefined)

  if (!publicType) return null

  const safety_note =
    typeof raw.safety_note === 'string' && raw.safety_note.trim()
      ? raw.safety_note.trim().slice(0, 400)
      : undefined

  const title = suggestedTitle.trim().slice(0, 120)
  const summary = refinedSummary.trim().slice(0, 600)
  const why = whyItMatters.trim().slice(0, 500)

  return {
    recommendedType: publicType,
    suggestedTitle: title,
    refinedSummary: summary,
    whyItMatters: why,
    nextSteps,
    recommended_movement_type: movementType,
    recommendation_reason: why,
    improved_title: title,
    improved_description: summary,
    suggested_action_steps: nextSteps,
    suggested_fields,
    ...(safety_note ? { safety_note } : {}),
  }
}

function parseEdgePayload(payload: EdgePayload | null): ActionPathSuggestion {
  if (!payload) {
    throw new ActionPathAiError(
      "We couldn't read the AI suggestion properly. Please try again.",
      'malformed',
    )
  }

  if (payload.success === false) {
    throwFromEdgePayload(payload)
  }

  const candidate = payload.success === true ? payload.data : payload.suggestion
  if (!candidate || typeof candidate !== 'object') {
    throw new ActionPathAiError(
      "We couldn't read the AI suggestion properly. Please try again.",
      'malformed',
    )
  }

  const normalized = normalizeSuggestion(candidate as unknown as Record<string, unknown>)
  if (!normalized) {
    throw new ActionPathAiError(
      "We couldn't read the AI suggestion properly. Please try again.",
      'malformed',
    )
  }

  return normalized
}

async function parseFunctionsHttpError(error: FunctionsHttpError): Promise<never> {
  try {
    if (error.context && typeof (error.context as Response).json === 'function') {
      const body = (await (error.context as Response).json()) as EdgePayload
      throwFromEdgePayload(body)
    }
  } catch (parseErr) {
    if (parseErr instanceof ActionPathAiError) throw parseErr
  }
  throw new ActionPathAiError(
    "We couldn't generate a suggestion right now. Please try again.",
    'api',
  )
}

function validationErrorMessage(reason: ActionPathValidationReason): string {
  switch (reason) {
    case 'empty':
    case 'too_short':
      return 'Add a little more detail so ActionPath AI can help.'
    case 'too_long':
      return `Please keep your idea under ${ACTIONPATH_INPUT_MAX} characters.`
    case 'gibberish':
    case 'blocklisted':
      return 'This looks too short or unclear. Try writing one sentence about the problem.'
    case 'unclear':
    default:
      return 'Please describe a real issue, idea, or community concern.'
  }
}

export async function generateActionPath(input: string): Promise<ActionPathSuggestion> {
  const validation = validateActionPathInput(input)
  if (!validation.valid) {
    throw new ActionPathAiError(validationErrorMessage(validation.reason), 'invalid_input')
  }

  const client = requireSupabase()
  const trimmed = validation.trimmed

  const invokePromise = client.functions.invoke('actionpath-ai', {
    body: { input: trimmed },
  })

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(
        new ActionPathAiError(
          'This is taking longer than expected. Please try again.',
          'timeout',
        ),
      )
    }, ACTIONPATH_REQUEST_TIMEOUT_MS)
  })

  try {
    const { data, error } = await Promise.race([invokePromise, timeoutPromise])

    if (error) {
      if (data && typeof data === 'object') {
        try {
          return parseEdgePayload(data as EdgePayload)
        } catch (bodyErr) {
          if (bodyErr instanceof ActionPathAiError) throw bodyErr
        }
      }
      if (error instanceof FunctionsHttpError) {
        await parseFunctionsHttpError(error)
      }
      if (error instanceof FunctionsRelayError) {
        throw new ActionPathAiError(
          'ActionPath AI is temporarily unavailable. Please try again shortly.',
          'network',
        )
      }
      const msg = error instanceof Error ? error.message : ''
      if (/failed to fetch|network|load failed/i.test(msg)) {
        throw new ActionPathAiError(
          'ActionPath AI is temporarily unavailable. Please try again shortly.',
          'network',
        )
      }
      throw new ActionPathAiError(
        "We couldn't generate a suggestion right now. Please try again.",
        'api',
      )
    }

    return parseEdgePayload(data as EdgePayload)
  } catch (err) {
    if (err instanceof ActionPathAiError) throw err
    const msg = err instanceof Error ? err.message : ''
    if (/failed to fetch|network|load failed/i.test(msg)) {
      throw new ActionPathAiError(
        'ActionPath AI is temporarily unavailable. Please try again shortly.',
        'network',
      )
    }
    throw new ActionPathAiError(
      "We couldn't generate a suggestion right now. Please try again.",
      'api',
    )
  }
}

/** Map AI suggested_fields into create-form state */
export function buildActionPathApplyResult(
  suggestion: ActionPathSuggestion,
): ActionPathApplyResult {
  const f = suggestion.suggested_fields
  const type = suggestion.recommended_movement_type
  const movementFieldUpdates: Partial<
    import('./movementFieldValues').MovementFieldValues
  > = {}

  if (type === 'youth_petition') {
    if (f.petition_issue) movementFieldUpdates.petition_issue = f.petition_issue
    if (f.petition_requested_change) {
      movementFieldUpdates.petition_requested_change = f.petition_requested_change
    }
    if (f.petition_target_authority) {
      movementFieldUpdates.petition_target_authority = f.petition_target_authority
    }
  }

  if (type === 'raise_voice') {
    if (f.issue_summary) movementFieldUpdates.issue_summary = f.issue_summary
    if (f.desired_change) movementFieldUpdates.desired_change = f.desired_change
  }

  if (type === 'idea_for_change') {
    if (f.proposed_solution) movementFieldUpdates.proposed_solution = f.proposed_solution
    if (f.expected_impact) movementFieldUpdates.expected_impact = f.expected_impact
  }

  if (type === 'volunteer_drive') {
    if (f.volunteer_purpose) movementFieldUpdates.contact_note = f.volunteer_purpose
    if (f.volunteer_tasks) {
      const existing = movementFieldUpdates.contact_note
      movementFieldUpdates.contact_note = existing
        ? `${existing}\n\nTasks: ${f.volunteer_tasks}`
        : f.volunteer_tasks
    }
  }

  if (type === 'fundraising') {
    if (f.fundraising_purpose) movementFieldUpdates.fundraising_purpose = f.fundraising_purpose
    if (f.beneficiary_description) {
      movementFieldUpdates.beneficiary_description = f.beneficiary_description
    }
  }

  if (type === 'peaceful_civic_action') {
    if (f.civic_purpose) movementFieldUpdates.action_purpose = f.civic_purpose
    if (f.safety_note) movementFieldUpdates.safety_note = f.safety_note
  }

  let pollOptions: string[] | undefined
  if (type === 'quick_youth_poll') {
    pollOptions = [
      f.poll_option_1,
      f.poll_option_2,
      f.poll_option_3,
      f.poll_option_4,
      f.poll_option_5,
    ].filter((o): o is string => Boolean(o?.trim()))
  }

  const title =
    type === 'quick_youth_poll' && f.poll_question
      ? f.poll_question.slice(0, 120)
      : suggestion.improved_title

  const description = suggestion.improved_description

  if (type === 'donation_relief') {
    const subtype = (f.relief_subtype as ReliefCreateSubtype | undefined) ?? 'item_donation'
    const valid: ReliefCreateSubtype[] = ['blood_donation', 'item_donation', 'fundraising']
    const reliefSubtype = valid.includes(subtype) ? subtype : 'item_donation'
    return {
      movementType: type,
      title,
      description,
      movementFieldUpdates,
      reliefRedirect: {
        subtype: reliefSubtype,
        title,
        description,
        reliefHints: {
          items_needed: f.need_summary,
          fundraising_purpose: f.fundraising_purpose,
          beneficiary_description: f.beneficiary_description,
          organizer_transparency_note: f.need_summary,
        },
      },
    }
  }

  return {
    movementType: type,
    title,
    description,
    pollOptions,
    movementFieldUpdates,
  }
}
