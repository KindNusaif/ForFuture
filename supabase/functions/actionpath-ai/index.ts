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

const MOVEMENT_TYPES = [
  'idea_for_change',
  'raise_voice',
  'youth_petition',
  'quick_youth_poll',
  'volunteer_drive',
  'donation_relief',
  'fundraising',
  'peaceful_civic_action',
] as const

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    recommended_movement_type: {
      type: 'string',
      enum: [...MOVEMENT_TYPES],
    },
    recommendation_reason: { type: 'string' },
    improved_title: { type: 'string' },
    improved_description: { type: 'string' },
    suggested_action_steps: {
      type: 'array',
      items: { type: 'string' },
      minItems: 3,
      maxItems: 5,
    },
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
        safety_note: { type: 'string' },
      },
      required: [],
      additionalProperties: false,
    },
  },
  required: [
    'recommended_movement_type',
    'recommendation_reason',
    'improved_title',
    'improved_description',
    'suggested_action_steps',
    'suggested_fields',
  ],
  additionalProperties: false,
} as const

const SYSTEM_PROMPT = `You are ActionPath AI for ForFuture, a youth civic-action platform.

Help users turn rough thoughts into clear, respectful civic movements. Preserve their meaning. Use constructive, youth-friendly language.

Rules:
- Never invent specific names, hospitals, money amounts, dates, authorities, or medical details unless the user provided them.
- If authority is unclear, use a generic target like "Local authorities" or "Relevant community leaders".
- No inflammatory, violent, hscam, or illegal content.
- Do not claim facts are verified.
- Keep title under 120 characters and description under 600 characters.
- suggested_action_steps: 3-5 practical, realistic steps.
- Fill suggested_fields only for keys relevant to the recommended_movement_type; leave other keys absent (use empty strings only when you must include a required schema key — prefer omitting unused keys).
- For quick_youth_poll: balanced, non-leading poll options in poll_option_1..poll_option_5.
- For donation_relief: set relief_subtype when reasonable; never invent urgent medical claims.
- For fundraising: do not invent goal amounts; beneficiary only from user input.
- For peaceful_civic_action: emphasize lawful, peaceful participation.
- Match the language of the user's input when clear (English, Tamil, or Sinhala); otherwise use English.`

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
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
    recommended_movement_type: string
    recommendation_reason: string
    improved_title: string
    improved_description: string
    suggested_action_steps: string[]
    suggested_fields: Record<string, string>
  }
} | { ok: false; error: string } {
  if (!data || typeof data !== 'object') return { ok: false, error: 'Invalid AI response' }
  const o = data as Record<string, unknown>
  const type = o.recommended_movement_type
  if (typeof type !== 'string' || !MOVEMENT_TYPES.includes(type as (typeof MOVEMENT_TYPES)[number])) {
    return { ok: false, error: 'Invalid movement type from AI' }
  }
  if (typeof o.recommendation_reason !== 'string' || !o.recommendation_reason.trim()) {
    return { ok: false, error: 'Missing recommendation reason' }
  }
  if (typeof o.improved_title !== 'string' || !o.improved_title.trim()) {
    return { ok: false, error: 'Missing improved title' }
  }
  if (typeof o.improved_description !== 'string' || !o.improved_description.trim()) {
    return { ok: false, error: 'Missing improved description' }
  }
  if (!Array.isArray(o.suggested_action_steps) || o.suggested_action_steps.length < 3) {
    return { ok: false, error: 'Invalid action steps' }
  }
  const steps = o.suggested_action_steps
    .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
    .map((s) => s.trim())
    .slice(0, 5)
  if (steps.length < 3) return { ok: false, error: 'Invalid action steps' }

  const fieldsRaw =
    o.suggested_fields && typeof o.suggested_fields === 'object'
      ? (o.suggested_fields as Record<string, unknown>)
      : {}

  return {
    ok: true,
    value: {
      recommended_movement_type: type,
      recommendation_reason: o.recommendation_reason.trim().slice(0, 500),
      improved_title: o.improved_title.trim().slice(0, 120),
      improved_description: o.improved_description.trim().slice(0, 600),
      suggested_action_steps: steps,
      suggested_fields: stripSuggestedFields(fieldsRaw),
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
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const openaiKey = Deno.env.get('OPENAI_API_KEY')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!openaiKey) {
    console.error('actionpath-ai: OPENAI_API_KEY is not configured')
    return jsonResponse({ error: 'AI assistant is not configured yet. Please try again later.' }, 503)
  }

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return jsonResponse({ error: 'Server configuration error' }, 500)
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Sign in to use ActionPath AI.' }, 401)
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser()

  if (userError || !user) {
    return jsonResponse({ error: 'Sign in to use ActionPath AI.' }, 401)
  }

  let body: { input?: unknown }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid request body' }, 400)
  }

  const input = typeof body.input === 'string' ? body.input.trim() : ''
  if (input.length < INPUT_MIN) {
    return jsonResponse({
      error: `Please write at least ${INPUT_MIN} characters so ActionPath AI can understand your idea.`,
    }, 400)
  }
  if (input.length > INPUT_MAX) {
    return jsonResponse({
      error: `Please keep your idea under ${INPUT_MAX} characters.`,
    }, 400)
  }

  const admin = createClient(supabaseUrl, serviceRoleKey)
  const rate = await checkRateLimit(admin, user.id)
  if (!rate.allowed) {
    return jsonResponse(
      {
        error: `Please wait ${rate.retryAfterSec} seconds before generating again.`,
        retry_after_sec: rate.retryAfterSec,
      },
      429,
    )
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
      return jsonResponse({ error: 'ActionPath AI could not generate a suggestion. Please try again.' }, 502)
    }

    const completion = await openaiRes.json()
    const content = completion?.choices?.[0]?.message?.content
    if (typeof content !== 'string') {
      return jsonResponse({ error: 'Unexpected AI response format' }, 502)
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(content)
    } catch {
      return jsonResponse({ error: 'Could not parse AI response' }, 502)
    }

    const validated = validateSuggestion(parsed)
    if (!validated.ok) {
      console.error('actionpath-ai validation', validated.error)
      return jsonResponse({ error: 'ActionPath AI returned an invalid suggestion. Please try again.' }, 502)
    }

    return jsonResponse({ suggestion: validated.value })
  } catch (err) {
    console.error('actionpath-ai', err instanceof Error ? err.message : 'unknown')
    return jsonResponse({ error: 'ActionPath AI failed. Please try again.' }, 500)
  }
})
