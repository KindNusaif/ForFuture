import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const INPUT_MIN = 20
const INPUT_MAX = 1500
const COOLDOWN_MS = 30_000
const MAX_PER_HOUR = 15
const HOUR_MS = 60 * 60 * 1000

/** Public recommendation categories returned to the client */
const RECOMMENDED_TYPES = [
  'petition',
  'youth_voice',
  'volunteer_drive',
  'poll',
  'relief_campaign',
] as const

type RecommendedType = (typeof RECOMMENDED_TYPES)[number]

/** Maps public type → ForFuture movement_type for create flow */
const TYPE_TO_MOVEMENT: Record<RecommendedType, string> = {
  petition: 'youth_petition',
  youth_voice: 'raise_voice',
  volunteer_drive: 'volunteer_drive',
  poll: 'quick_youth_poll',
  relief_campaign: 'donation_relief',
}

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    recommendedType: {
      type: 'string',
      enum: [...RECOMMENDED_TYPES],
    },
    suggestedTitle: { type: 'string' },
    refinedSummary: { type: 'string' },
    whyItMatters: { type: 'string' },
    nextSteps: {
      type: 'array',
      items: { type: 'string' },
      minItems: 3,
      maxItems: 5,
    },
    safety_note: { type: 'string' },
    suggested_fields: {
      type: 'object',
      properties: {
        petition_issue: { type: 'string' },
        petition_requested_change: { type: 'string' },
        petition_target_authority: { type: 'string' },
        poll_question: { type: 'string' },
        poll_option_1: { type: 'string' },
        poll_option_2: { type: 'string' },
        poll_option_3: { type: 'string' },
        poll_option_4: { type: 'string' },
        poll_option_5: { type: 'string' },
        issue_summary: { type: 'string' },
        desired_change: { type: 'string' },
        proposed_solution: { type: 'string' },
        expected_impact: { type: 'string' },
        volunteer_purpose: { type: 'string' },
        volunteer_tasks: { type: 'string' },
        need_summary: { type: 'string' },
        relief_subtype: {
          type: 'string',
          enum: ['blood_donation', 'item_donation', 'fundraising'],
        },
        fundraising_purpose: { type: 'string' },
        beneficiary_description: { type: 'string' },
        civic_purpose: { type: 'string' },
      },
      required: [],
      additionalProperties: false,
    },
  },
  required: [
    'recommendedType',
    'suggestedTitle',
    'refinedSummary',
    'whyItMatters',
    'nextSteps',
    'suggested_fields',
  ],
  additionalProperties: false,
} as const

const SYSTEM_PROMPT = `You are ActionPath AI for ForFuture, a youth civic-action platform.

Help users turn rough thoughts into clear, respectful civic movements. Preserve their meaning. Use constructive, youth-friendly language.

Rules:
- recommendedType must be one of: petition, youth_voice, volunteer_drive, poll, relief_campaign.
- petition = structured petition; youth_voice = raise a community issue safely; volunteer_drive = volunteer event; poll = quick youth poll; relief_campaign = donation/relief need.
- Never invent specific names, hospitals, money amounts, dates, authorities, or medical details unless the user provided them.
- If authority is unclear, use a generic target like "Local authorities" or "Relevant community leaders".
- No inflammatory, violent, scam, or illegal content.
- Do not claim facts are verified.
- suggestedTitle under 120 characters; refinedSummary under 600 characters.
- nextSteps: 3-5 practical, realistic steps.
- Fill suggested_fields only for keys relevant to recommendedType; omit unused keys.
- For poll: balanced, non-leading poll options in poll_option_1..poll_option_5.
- For relief_campaign: set relief_subtype when reasonable; never invent urgent medical claims.
- Match the language of the user's input when clear (English, Tamil, or Sinhala); otherwise use English.
- Include safety_note only when the topic needs a brief lawful, peaceful, or verification reminder; otherwise omit it.`

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function fail(message: string, status = 400, extra?: Record<string, unknown>) {
  return jsonResponse({ success: false, message, ...extra }, status)
}

function ok(data: Record<string, unknown>) {
  return jsonResponse({ success: true, data })
}

function stripSuggestedFields(
  raw: Record<string, unknown>,
): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === 'string' && value.trim()) out[key] = value.trim()
  }
  return out
}

function validateSuggestion(data: unknown): {
  ok: true
  value: {
    recommendedType: RecommendedType
    suggestedTitle: string
    refinedSummary: string
    whyItMatters: string
    nextSteps: string[]
    recommended_movement_type: string
    recommendation_reason: string
    improved_title: string
    improved_description: string
    suggested_action_steps: string[]
    suggested_fields: Record<string, string>
    safety_note?: string
  }
} | { ok: false; error: string } {
  if (!data || typeof data !== 'object') return { ok: false, error: 'Invalid AI response' }

  const o = data as Record<string, unknown>
  const recommendedType = o.recommendedType
  if (
    typeof recommendedType !== 'string' ||
    !RECOMMENDED_TYPES.includes(recommendedType as RecommendedType)
  ) {
    return { ok: false, error: 'Invalid recommended type from AI' }
  }

  if (typeof o.suggestedTitle !== 'string' || !o.suggestedTitle.trim()) {
    return { ok: false, error: 'Missing suggested title' }
  }
  if (typeof o.refinedSummary !== 'string' || !o.refinedSummary.trim()) {
    return { ok: false, error: 'Missing refined summary' }
  }
  if (typeof o.whyItMatters !== 'string' || !o.whyItMatters.trim()) {
    return { ok: false, error: 'Missing why it matters' }
  }
  if (!Array.isArray(o.nextSteps) || o.nextSteps.length < 3) {
    return { ok: false, error: 'Invalid next steps' }
  }

  const nextSteps = o.nextSteps
    .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
    .map((s) => s.trim())
    .slice(0, 5)
  if (nextSteps.length < 3) return { ok: false, error: 'Invalid next steps' }

  const fieldsRaw =
    o.suggested_fields && typeof o.suggested_fields === 'object'
      ? (o.suggested_fields as Record<string, unknown>)
      : {}

  const safetyNote =
    typeof o.safety_note === 'string' && o.safety_note.trim()
      ? o.safety_note.trim().slice(0, 400)
      : undefined

  const type = recommendedType as RecommendedType
  const movementType = TYPE_TO_MOVEMENT[type]
  const suggestedTitle = o.suggestedTitle.trim().slice(0, 120)
  const refinedSummary = o.refinedSummary.trim().slice(0, 600)
  const whyItMatters = o.whyItMatters.trim().slice(0, 500)

  return {
    ok: true,
    value: {
      recommendedType: type,
      suggestedTitle,
      refinedSummary,
      whyItMatters,
      nextSteps,
      recommended_movement_type: movementType,
      recommendation_reason: whyItMatters,
      improved_title: suggestedTitle,
      improved_description: refinedSummary,
      suggested_action_steps: nextSteps,
      suggested_fields: stripSuggestedFields(fieldsRaw),
      ...(safetyNote ? { safety_note: safetyNote } : {}),
    },
  }
}

async function checkRateLimit(
  admin: ReturnType<typeof createClient>,
  userId: string,
): Promise<{ allowed: true } | { allowed: false; retryAfterSec: number }> {
  const now = new Date()
  const { data: row } = await admin
    .from('actionpath_ai_usage')
    .select('window_start, request_count, last_request_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (row?.last_request_at) {
    const last = new Date(row.last_request_at).getTime()
    if (now.getTime() - last < COOLDOWN_MS) {
      return {
        allowed: false,
        retryAfterSec: Math.ceil((COOLDOWN_MS - (now.getTime() - last)) / 1000),
      }
    }
  }

  let windowStart = row?.window_start ? new Date(row.window_start) : now
  let count = row?.request_count ?? 0

  if (now.getTime() - windowStart.getTime() > HOUR_MS) {
    windowStart = now
    count = 0
  }

  if (count >= MAX_PER_HOUR) {
    const resetAt = windowStart.getTime() + HOUR_MS
    return {
      allowed: false,
      retryAfterSec: Math.max(60, Math.ceil((resetAt - now.getTime()) / 1000)),
    }
  }

  await admin.from('actionpath_ai_usage').upsert({
    user_id: userId,
    window_start: windowStart.toISOString(),
    request_count: count + 1,
    last_request_at: now.toISOString(),
  })

  return { allowed: true }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return fail('Method not allowed', 405)
  }

  const openaiKey = Deno.env.get('OPENAI_API_KEY')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!openaiKey) {
    console.error('actionpath-ai: OPENAI_API_KEY is not configured')
    return fail('ActionPath AI is not available right now. Please try again later.', 503)
  }

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    console.error('actionpath-ai: missing Supabase env')
    return fail('ActionPath AI is not available right now. Please try again later.', 500)
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return fail('Sign in to use ActionPath AI.', 401)
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser()

  if (userError || !user) {
    return fail('Sign in to use ActionPath AI.', 401)
  }

  let body: { input?: unknown }
  try {
    body = await req.json()
  } catch {
    return fail('Invalid request. Please try again.', 400)
  }

  const input = typeof body.input === 'string' ? body.input.trim() : ''
  if (input.length < INPUT_MIN) {
    return fail(
      `Please write at least ${INPUT_MIN} characters so ActionPath AI can understand your idea.`,
      400,
    )
  }
  if (input.length > INPUT_MAX) {
    return fail(`Please keep your idea under ${INPUT_MAX} characters.`, 400)
  }

  const admin = createClient(supabaseUrl, serviceRoleKey)
  const rate = await checkRateLimit(admin, user.id)
  if (!rate.allowed) {
    return fail('ActionPath AI is busy at the moment. Please try again shortly.', 429, {
      retry_after_sec: rate.retryAfterSec,
    })
  }

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.4,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Analyze this youth civic idea and return structured JSON.\n\nUser input:\n${input}`,
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'action_path_suggestion',
            strict: true,
            schema: RESPONSE_SCHEMA,
          },
        },
      }),
    })

    if (!openaiRes.ok) {
      const errText = await openaiRes.text()
      console.error('actionpath-ai openai error', openaiRes.status, errText.slice(0, 200))
      if (openaiRes.status === 429) {
        return fail('ActionPath AI is busy at the moment. Please try again shortly.', 503)
      }
      return fail(
        "We couldn't generate a suggestion right now. Please try again.",
        502,
      )
    }

    const completion = await openaiRes.json()
    const content = completion?.choices?.[0]?.message?.content
    if (typeof content !== 'string') {
      console.error('actionpath-ai: missing message content')
      return fail(
        "We couldn't generate a suggestion right now. Please try again.",
        502,
      )
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(content)
    } catch {
      console.error('actionpath-ai: JSON parse failed')
      return fail(
        "We couldn't generate a suggestion right now. Please try again.",
        502,
      )
    }

    const validated = validateSuggestion(parsed)
    if (!validated.ok) {
      console.error('actionpath-ai validation', validated.error)
      return fail(
        "We couldn't generate a suggestion right now. Please try again.",
        502,
      )
    }

    return ok(validated.value)
  } catch (err) {
    console.error('actionpath-ai', err instanceof Error ? err.message : 'unknown')
    return fail("We couldn't generate a suggestion right now. Please try again.", 500)
  }
})
