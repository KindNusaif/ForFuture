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

export const ACTIONPATH_GENERIC_ERROR =
  'ActionPath AI could not generate a suggestion. Please try again.'

/** Shown when the edge function URL returns 404 or the browser blocks the request (CORS). */
export const ACTIONPATH_NOT_DEPLOYED =
  'ActionPath AI is not available yet. Deploy the actionpath-ai Edge Function to your Supabase project.'

/** Internal slug used by create-form mapping */
export type ActionPathRecommendedType =
  | 'petition'
  | 'youth_voice'
  | 'volunteer_drive'
  | 'poll'
  | 'relief_campaign'
  | 'fundraising'

export interface ActionPathApiSuggestion {
  recommendedType: string
  title: string
  summary: string
  whyItMatters: string
  recommendedNextSteps: string[]
}

export type ActionPathEdgeResponse =
  | { ok: true; suggestion: ActionPathApiSuggestion }
  | { ok: false; error: string; code?: string }

export interface ActionPathSuggestion {
  recommendedType: ActionPathRecommendedType
  recommendedTypeLabel: string
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
  | 'config'
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

const DISPLAY_TYPE_TO_INTERNAL: Record<string, ActionPathRecommendedType> = {
  'raise your voice': 'youth_voice',
  petition: 'petition',
  'youth petition': 'petition',
  'volunteer drive': 'volunteer_drive',
  'donation & relief need': 'relief_campaign',
  'donation and relief need': 'relief_campaign',
  'fundraising campaign': 'fundraising',
  'quick poll': 'poll',
  'community poll': 'poll',
}

const TYPE_TO_MOVEMENT: Record<ActionPathRecommendedType, MovementType> = {
  petition: 'youth_petition',
  youth_voice: 'raise_voice',
  volunteer_drive: 'volunteer_drive',
  poll: 'quick_youth_poll',
  relief_campaign: 'donation_relief',
  fundraising: 'fundraising',
}

function devLog(status: number | string, body: unknown): void {
  if (!import.meta.env.DEV) return
  console.log('[ActionPath]', status, JSON.stringify(sanitizeDebugBody(body)))
}

function sanitizeDebugBody(body: unknown): unknown {
  if (body == null) return body
  if (typeof body === 'string') {
    try {
      return sanitizeDebugBody(JSON.parse(body))
    } catch {
      return { raw: body.slice(0, 200) }
    }
  }
  if (typeof body !== 'object') return body

  const o = body as Record<string, unknown>
  if (o.ok === true && o.suggestion && typeof o.suggestion === 'object') {
    const s = o.suggestion as Record<string, unknown>
    return {
      ok: true,
      suggestion: {
        recommendedType: s.recommendedType,
        titleLength: typeof s.title === 'string' ? s.title.length : 0,
        summaryLength: typeof s.summary === 'string' ? s.summary.length : 0,
        stepsCount: Array.isArray(s.recommendedNextSteps) ? s.recommendedNextSteps.length : 0,
      },
    }
  }
  if (o.ok === false) {
    return { ok: false, error: String(o.error ?? ''), code: typeof o.code === 'string' ? o.code : undefined }
  }
  return { ok: o.ok, keys: Object.keys(o) }
}

function legacyToSuggestion(raw: Record<string, unknown>): ActionPathApiSuggestion | null {
  const recommendedType =
    typeof raw.recommendedType === 'string'
      ? raw.recommendedType
      : typeof raw.movementType === 'string'
        ? raw.movementType
        : typeof raw.recommended_movement_type === 'string'
          ? raw.recommended_movement_type
          : ''
  const title =
    typeof raw.title === 'string'
      ? raw.title
      : typeof raw.improvedTitle === 'string'
        ? raw.improvedTitle
        : typeof raw.suggestedTitle === 'string'
          ? raw.suggestedTitle
          : typeof raw.improved_title === 'string'
            ? raw.improved_title
            : ''
  const summary =
    typeof raw.summary === 'string'
      ? raw.summary
      : typeof raw.improvedMessage === 'string'
        ? raw.improvedMessage
        : typeof raw.refinedSummary === 'string'
          ? raw.refinedSummary
          : typeof raw.improved_description === 'string'
            ? raw.improved_description
            : ''
  const whyItMatters =
    typeof raw.whyItMatters === 'string'
      ? raw.whyItMatters
      : typeof raw.recommendation_reason === 'string'
        ? raw.recommendation_reason
        : summary
  const stepsRaw =
    raw.recommendedNextSteps ?? raw.nextSteps ?? raw.next_steps ?? raw.suggested_action_steps
  if (!recommendedType || !title || !summary || !Array.isArray(stepsRaw)) return null
  const recommendedNextSteps = stepsRaw
    .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
    .map((s) => s.trim())
  if (recommendedNextSteps.length < 3) return null
  return {
    recommendedType,
    title: title.trim(),
    summary: summary.trim(),
    whyItMatters: whyItMatters.trim(),
    recommendedNextSteps,
  }
}

function coalesceEdgeBody(data: unknown): ActionPathEdgeResponse | null {
  if (data == null) return null
  if (typeof data === 'string') {
    try {
      return coalesceEdgeBody(JSON.parse(data))
    } catch {
      return null
    }
  }
  if (typeof data !== 'object') return null

  const o = data as Record<string, unknown>

  if (o.ok === true && o.suggestion && typeof o.suggestion === 'object') {
    return { ok: true, suggestion: o.suggestion as ActionPathApiSuggestion }
  }
  if (o.ok === false && typeof o.error === 'string') {
    return {
      ok: false,
      error: o.error,
      code: typeof o.code === 'string' ? o.code : undefined,
    }
  }

  if (typeof o.error === 'string' && o.ok !== true) {
    return {
      ok: false,
      error: o.error,
      code: typeof o.code === 'string' ? o.code : undefined,
    }
  }

  if (typeof o.result === 'string' && o.result.trim()) {
    try {
      const parsed = JSON.parse(
        o.result.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim(),
      ) as Record<string, unknown>
      const suggestion = legacyToSuggestion(parsed)
      if (suggestion) return { ok: true, suggestion }
    } catch {
      /* fall through */
    }
  }

  if (o.success === true && o.data && typeof o.data === 'object') {
    const suggestion = legacyToSuggestion(o.data as Record<string, unknown>)
    if (suggestion) return { ok: true, suggestion }
  }
  if (o.success === false) {
    return {
      ok: false,
      error:
        typeof o.message === 'string'
          ? o.message
          : typeof o.error === 'string'
            ? o.error
            : ACTIONPATH_GENERIC_ERROR,
    }
  }

  const direct = legacyToSuggestion(o)
  if (direct) return { ok: true, suggestion: direct }

  return null
}

function normalizeInternalType(displayType: string): ActionPathRecommendedType | null {
  const key = displayType.trim().toLowerCase()
  if (DISPLAY_TYPE_TO_INTERNAL[key]) return DISPLAY_TYPE_TO_INTERNAL[key]
  const slug = key.replace(/\s+/g, '_') as ActionPathRecommendedType
  if (slug in TYPE_TO_MOVEMENT) return slug
  if (key.includes('petition')) return 'petition'
  if (key.includes('volunteer')) return 'volunteer_drive'
  if (key.includes('relief') || key.includes('donation')) return 'relief_campaign'
  if (key.includes('fundrais')) return 'fundraising'
  if (key.includes('poll')) return 'poll'
  if (key.includes('voice')) return 'youth_voice'
  return null
}

function isUserFacingMessage(message: string): boolean {
  const lower = message.toLowerCase()
  return (
    lower.includes('sign in') ||
    lower.includes('busy') ||
    lower.includes('please wait') ||
    lower.includes('many times this hour') ||
    lower.includes('try again in about') ||
    lower.includes('describe') ||
    lower.includes('characters') ||
    lower.includes('real issue') ||
    lower.includes('unclear') ||
    lower.includes('invalid request') ||
    lower.includes('openai rate limit') ||
    lower.includes('rate limit reached')
  )
}

function mapErrorCode(message: string, code?: string): ActionPathErrorCode {
  if (code === 'auth') return 'auth'
  if (code === 'config') return 'config'
  if (code === 'rate_limit') return 'rate_limit'
  if (code === 'openai_rate_limit') return 'api'
  if (code === 'invalid_input') return 'invalid_input'
  if (code === 'api' || code === 'malformed') return 'api'

  const lower = message.toLowerCase()
  if (lower.includes('sign in')) return 'auth'
  if (lower.includes('openai rate limit') || lower.includes('rate limit reached')) return 'api'
  if (
    lower.includes('busy') ||
    lower.includes('please wait') ||
    lower.includes('many times this hour')
  ) {
    return 'rate_limit'
  }
  if (lower.includes('describe') || lower.includes('characters')) return 'invalid_input'
  if (lower.includes('real issue') || lower.includes('unclear')) return 'invalid_input'
  return 'api'
}

function throwFromEdgeBody(body: ActionPathEdgeResponse): never {
  if (body.ok !== false) {
    throw new ActionPathAiError(ACTIONPATH_GENERIC_ERROR, 'malformed')
  }
  const raw = body.error?.trim() ?? ''
  const message =
    raw &&
    (isUserFacingMessage(raw) ||
      body.code === 'config' ||
      body.code === 'rate_limit' ||
      body.code === 'openai_rate_limit')
      ? raw
      : ACTIONPATH_GENERIC_ERROR
  throw new ActionPathAiError(message, mapErrorCode(raw || message, body.code))
}

function resolveInvokePayload(data: unknown, error: unknown): ActionPathSuggestion {
  const body = coalesceEdgeBody(data)
  if (body?.ok === true && body.suggestion) {
    return mapApiSuggestion(body.suggestion)
  }
  if (body?.ok === false) {
    throwFromEdgeBody(body)
  }

  if (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    devLog('invoke-error', { message: errMsg, data })
    if (isLikelyNotDeployed(error)) throwNotDeployed()
    if (/failed to fetch|network|load failed/i.test(errMsg)) {
      throw new ActionPathAiError(
        'ActionPath AI is temporarily unavailable. Please try again shortly.',
        'network',
      )
    }
    throw new ActionPathAiError(errMsg || ACTIONPATH_GENERIC_ERROR, 'api')
  }

  return parseEdgeResponse(data)
}

function mapApiSuggestion(api: ActionPathApiSuggestion): ActionPathSuggestion {
  const internalType = normalizeInternalType(api.recommendedType)
  if (!internalType) {
    throw new ActionPathAiError(ACTIONPATH_GENERIC_ERROR, 'malformed')
  }

  const title = api.title?.trim().slice(0, 120) ?? ''
  const summary = api.summary?.trim().slice(0, 600) ?? ''
  const why = (api.whyItMatters?.trim() || summary).slice(0, 500)
  const nextSteps = (api.recommendedNextSteps ?? [])
    .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
    .map((s) => s.trim())
    .slice(0, 5)

  if (!title || !summary || nextSteps.length < 3) {
    throw new ActionPathAiError(ACTIONPATH_GENERIC_ERROR, 'malformed')
  }

  const movementType = TYPE_TO_MOVEMENT[internalType]

  return {
    recommendedType: internalType,
    recommendedTypeLabel: api.recommendedType.trim(),
    suggestedTitle: title,
    refinedSummary: summary,
    whyItMatters: why,
    nextSteps,
    recommended_movement_type: movementType,
    recommendation_reason: why,
    improved_title: title,
    improved_description: summary,
    suggested_action_steps: nextSteps,
    suggested_fields: {},
  }
}

function parseEdgeResponse(data: unknown): ActionPathSuggestion {
  const body = coalesceEdgeBody(data)
  if (!body) {
    throw new ActionPathAiError(ACTIONPATH_GENERIC_ERROR, 'malformed')
  }
  if (body.ok === false) {
    throwFromEdgeBody(body)
  }
  if (body.ok !== true || !body.suggestion) {
    throw new ActionPathAiError(ACTIONPATH_GENERIC_ERROR, 'malformed')
  }
  return mapApiSuggestion(body.suggestion)
}

function throwNotDeployed(): never {
  throw new ActionPathAiError(ACTIONPATH_NOT_DEPLOYED, 'config')
}

/** Missing function: OPTIONS 404 → browser CORS error on POST; invoke often surfaces as fetch/relay errors. */
function isLikelyNotDeployed(error: unknown, status?: number): boolean {
  if (status === 404) return true
  if (error instanceof FunctionsRelayError) return true
  const msg = error instanceof Error ? error.message : String(error ?? '')
  const lower = msg.toLowerCase()
  return (
    /failed to fetch|load failed|networkerror/i.test(msg) ||
    /failed to send a request|edge function|non-2xx|404|not found/i.test(lower)
  )
}

async function parseFunctionsHttpError(error: FunctionsHttpError): Promise<never> {
  let status = (error as { status?: number }).status ?? 500
  let body: unknown = null

  try {
    if (error.context && typeof (error.context as Response).json === 'function') {
      const res = error.context as Response
      status = res.status
      body = await res.json()
    }
  } catch {
    /* use fallback */
  }

  devLog(status, body)

  const parsed = coalesceEdgeBody(body)
  if (parsed) throwFromEdgeBody(parsed)

  if (isLikelyNotDeployed(error, status)) throwNotDeployed()

  throw new ActionPathAiError(ACTIONPATH_GENERIC_ERROR, 'api')
}

function validationErrorMessage(reason: ActionPathValidationReason): string {
  switch (reason) {
    case 'empty':
    case 'too_short':
      return 'Please describe your concern in more detail.'
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

    devLog(error ? 'invoke-error' : 200, data)

    if (error instanceof FunctionsHttpError) {
      let body = coalesceEdgeBody(data)
      if (!body) {
        try {
          if (error.context && typeof (error.context as Response).json === 'function') {
            body = coalesceEdgeBody(await (error.context as Response).json())
            devLog((error.context as Response).status, body)
          }
        } catch {
          /* fall through */
        }
      }
      if (body?.ok === true && body.suggestion) {
        return mapApiSuggestion(body.suggestion)
      }
      if (body?.ok === false) {
        throwFromEdgeBody(body)
      }
      await parseFunctionsHttpError(error)
    }

    return resolveInvokePayload(data, error)
  } catch (err) {
    if (err instanceof ActionPathAiError) throw err
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ActionPathAiError(
        'This is taking longer than expected. Please try again.',
        'timeout',
      )
    }
    if (isLikelyNotDeployed(err)) throwNotDeployed()
    const msg = err instanceof Error ? err.message : ''
    if (/failed to fetch|network|load failed/i.test(msg)) {
      throw new ActionPathAiError(
        'ActionPath AI is temporarily unavailable. Please try again shortly.',
        'network',
      )
    }
    throw new ActionPathAiError(ACTIONPATH_GENERIC_ERROR, 'api')
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
