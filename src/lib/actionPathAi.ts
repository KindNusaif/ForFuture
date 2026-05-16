import { FunctionsHttpError } from '@supabase/supabase-js'
import type { MovementType } from '../types'
import type { ReliefCreateSubtype } from './reliefHub'
import { requireSupabase } from './supabase'
import { enhanceSupabaseError } from './supabaseErrors'

export const ACTIONPATH_INPUT_MIN = 20
export const ACTIONPATH_INPUT_MAX = 1500

export interface ActionPathSuggestion {
  recommended_movement_type: MovementType
  recommendation_reason: string
  improved_title: string
  improved_description: string
  suggested_action_steps: string[]
  suggested_fields: Record<string, string>
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

export async function generateActionPath(input: string): Promise<ActionPathSuggestion> {
  const client = requireSupabase()
  const trimmed = input.trim()

  const { data, error } = await client.functions.invoke('actionpath-ai', {
    body: { input: trimmed },
  })

  if (error) {
    if (error instanceof FunctionsHttpError) {
      try {
        const body = (await error.context.json()) as {
          error?: string
          retry_after_sec?: number
        }
        if (body?.error) {
          const err = new Error(body.error)
          if (body.retry_after_sec) {
            ;(err as Error & { retryAfterSec?: number }).retryAfterSec = body.retry_after_sec
          }
          throw err
        }
      } catch (parseErr) {
        if (parseErr instanceof Error && parseErr.message !== error.message) throw parseErr
      }
    }
    throw enhanceSupabaseError(error)
  }

  const payload = data as { suggestion?: ActionPathSuggestion; error?: string; retry_after_sec?: number }

  if (payload?.error) {
    const err = new Error(payload.error)
    if (payload.retry_after_sec) {
      ;(err as Error & { retryAfterSec?: number }).retryAfterSec = payload.retry_after_sec
    }
    throw err
  }

  if (!payload?.suggestion) {
    throw new Error('ActionPath AI did not return a suggestion. Please try again.')
  }

  return payload.suggestion
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
    if (f.petition_requested_change) movementFieldUpdates.petition_requested_change = f.petition_requested_change
    if (f.petition_target_authority) movementFieldUpdates.petition_target_authority = f.petition_target_authority
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
    if (f.beneficiary_description) movementFieldUpdates.beneficiary_description = f.beneficiary_description
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
