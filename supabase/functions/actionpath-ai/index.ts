import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const INPUT_MIN = 15
const INPUT_MAX = 1500
const COOLDOWN_MS = 30_000
const MAX_PER_HOUR = 15
const HOUR_MS = 60 * 60 * 1000

const RECOMMENDED_TYPES = [
  'petition',
  'youth_voice',
  'volunteer_drive',
  'poll',
  'relief_campaign',
] as const

type RecommendedType = (typeof RECOMMENDED_TYPES)[number]

const TYPE_TO_MOVEMENT: Record<RecommendedType, string> = {
  petition: 'youth_petition',
  youth_voice: 'raise_voice',
  volunteer_drive: 'volunteer_drive',
  poll: 'quick_youth_poll',
  relief_campaign: 'donation_relief',
}

/** Structured output schema — strict:false so optional fields stay reliable */
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
      additionalProperties: { type: 'string' },
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

const SYSTEM_PROMPT = `You are ActionPath AI for ForFuture — a youth civic-action platform in Sri Lanka and beyond.

Your job: turn a young person's rough concern into a clear, practical civic action draft they can review and edit before publishing.

Rules:
- recommendedType must be exactly one of: petition, youth_voice, volunteer_drive, poll, relief_campaign.
- petition = formal petition; youth_voice = raise a community issue safely; volunteer_drive = organize volunteers; poll = quick youth poll; relief_campaign = donation/relief need.
- Never auto-publish. The user must review every field before posting.
- Keep language respectful, constructive, and youth-friendly. No violence, hate, scams, or illegal tactics.
- Do not invent specific names, hospitals, amounts, dates, or authorities unless the user provided them.
- If a target is unclear, use a generic phrase like "Local authorities" or "Relevant community leaders".
- suggestedTitle: concise, under 120 characters.
- refinedSummary: clear problem + ask, under 600 characters.
- whyItMatters: 1–3 sentences on community impact.
- nextSteps: 3–5 realistic steps a youth group could take locally.
- suggested_fields: only string keys relevant to recommendedType (e.g. petition_issue, poll_question, poll_option_1…).
- For polls: balanced, non-leading options.
- For relief_campaign: set relief_subtype when reasonable (blood_donation | item_donation | fundraising).
- Match the user's language when clear (English, Tamil, Sinhala); otherwise English.
- safety_note: include only when a brief lawful/peaceful reminder is needed; otherwise omit the key.
- Even if input is brief but valid, still return a useful draft — do not refuse.`

const BLOCKLIST = new Set([
  'test',
  'testing',
  'hi',
  'hello',
  'hey',
  'asdf',
  'qwerty',
  'abc',
  'xxx',
  'sample',
  'demo',
])

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function fail(
  message: string,
  status = 400,
  extra?: Record<string, unknown> & { code?: string },
) {
  const { code, ...rest } = extra ?? {}
  return jsonResponse({ success: false, message, code, ...rest }, status)
}

function ok(data: Record<string, unknown>) {
  return jsonResponse({ success: true, data })
}

function isRepeatedCharacterSpam(text: string): boolean {
  const compact = text.replace(/\s/g, '')
  if (compact.length < 8) return false
  const counts = new Map<string, number>()
  for (const ch of compact) {
    const key = ch.toLowerCase()
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  const maxCount = Math.max(...counts.values())
  if (maxCount / compact.length >= 0.55) return true
  if (/(.)\1{4,}/u.test(compact)) return true
  if (/(.{2,4})\1{3,}/u.test(compact)) return true
  return false
}

function hasRepeatingSubstringSpam(text: string): boolean {
  const compact = text.replace(/\s/g, '').toLowerCase()
  if (/([a-z])\1{4,}/.test(compact)) return true
  if (/(.{2,6})\1{3,}/.test(compact)) return true
  return false
}

function isUnspacedKeyboardBlob(text: string): boolean {
  const trimmed = text.trim()
  if (trimmed.includes(' ')) return false
  const compactLen = trimmed.replace(/\s/g, '').length
  if (compactLen >= 25 && /[a-zA-Z]/.test(trimmed)) return true
  const tokens = trimmed.split(/\s+/)
  if (tokens.length === 1 && /^[a-zA-Z0-9]{30,}$/.test(tokens[0]!)) return true
  return false
}

function looksLikeRealWord(token: string): boolean {
  if (token.length < 4) return false
  const lower = token.toLowerCase()
  const lettersOnly = lower.replace(/[^a-z]/g, '')
  if (lettersOnly.length < 4) return false
  const vowels = lettersOnly.replace(/[^aeiou]/g, '').length
  const consonants = lettersOnly.length - vowels
  if (vowels === 0 || consonants === 0) return false
  const vowelRatio = vowels / lettersOnly.length
  if (vowelRatio < 0.2 || vowelRatio > 0.75) return false
  const charCounts = new Map<string, number>()
  for (const ch of lettersOnly) {
    charCounts.set(ch, (charCounts.get(ch) ?? 0) + 1)
  }
  if (Math.max(...charCounts.values()) / lettersOnly.length > 0.45) return false
  return true
}

function hasMeaningfulWords(text: string): boolean {
  const hasNonLatin = /[^\u0000-\u024F]/u.test(text)
  if (hasNonLatin) {
    const words = [...text.matchAll(/[\p{L}\p{M}]{3,}/gu)].map((m) => m[0])
    return words.length >= 2 || (words.length === 1 && words[0]!.length >= 6)
  }
  const words = [...text.matchAll(/[\p{L}\p{M}]{3,}/gu)].map((m) => m[0])
  const realWords = words.filter(looksLikeRealWord)
  if (realWords.length >= 2) return true
  if (realWords.length === 1 && realWords[0]!.length >= 8) return true
  return false
}

function isKeyboardMash(text: string): boolean {
  const letters = text.replace(/[^a-zA-Z]/g, '')
  if (letters.length < 12) return false
  const vowels = letters.replace(/[^aeiouAEIOU]/g, '').length
  if (vowels === 0) return true
  if (vowels / letters.length < 0.12) return true
  const upper = letters.replace(/[^A-Z]/g, '').length
  if (upper / letters.length > 0.75 && !text.includes(' ')) return true
  return false
}

function validateUserInput(input: string): { ok: true } | { ok: false; message: string } {
  if (input.length < INPUT_MIN) {
    return {
      ok: false,
      message: 'Add a little more detail so ActionPath AI can help.',
    }
  }
  if (input.length > INPUT_MAX) {
    return {
      ok: false,
      message: `Please keep your idea under ${INPUT_MAX} characters.`,
    }
  }

  const normalized = input
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .trim()
  if (BLOCKLIST.has(normalized)) {
    return {
      ok: false,
      message: 'Please describe a real issue, idea, or community concern.',
    }
  }
  if (isRepeatedCharacterSpam(input)) {
    return {
      ok: false,
      message: 'This looks too short or unclear. Try writing one sentence about the problem.',
    }
  }
  if (hasRepeatingSubstringSpam(input)) {
    return {
      ok: false,
      message: 'This looks too short or unclear. Try writing one sentence about the problem.',
    }
  }
  if (isUnspacedKeyboardBlob(input)) {
    return {
      ok: false,
      message: 'This looks too short or unclear. Try writing one sentence about the problem.',
    }
  }
  if (isKeyboardMash(input)) {
    return {
      ok: false,
      message: 'This looks too short or unclear. Try writing one sentence about the problem.',
    }
  }
  if (!hasMeaningfulWords(input)) {
    return {
      ok: false,
      message: 'Please describe a real issue, idea, or community concern.',
    }
  }

  return { ok: true }
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
    return fail('Method not allowed', 405, { code: 'method_not_allowed' })
  }

  const openaiKey = Deno.env.get('OPENAI_API_KEY')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!openaiKey) {
    console.error('actionpath-ai: OPENAI_API_KEY is not configured')
    return fail('ActionPath AI is temporarily unavailable. Please try again shortly.', 503, {
      code: 'config',
    })
  }

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    console.error('actionpath-ai: missing Supabase env')
    return fail('ActionPath AI is temporarily unavailable. Please try again shortly.', 500, {
      code: 'config',
    })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return fail('Sign in to use ActionPath AI.', 401, { code: 'auth' })
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser()

  if (userError || !user) {
    return fail('Sign in to use ActionPath AI.', 401, { code: 'auth' })
  }

  let body: { input?: unknown }
  try {
    body = await req.json()
  } catch {
    return fail('Invalid request. Please try again.', 400, { code: 'invalid_input' })
  }

  const input = typeof body.input === 'string' ? body.input.trim() : ''
  const inputCheck = validateUserInput(input)
  if (!inputCheck.ok) {
    return fail(inputCheck.message, 400, { code: 'invalid_input' })
  }

  const admin = createClient(supabaseUrl, serviceRoleKey)
  const rate = await checkRateLimit(admin, user.id)
  if (!rate.allowed) {
    return fail('ActionPath AI is busy at the moment. Please try again shortly.', 429, {
      code: 'rate_limit',
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
            content: `Analyze this youth civic idea and return JSON matching the schema.\n\nUser input:\n${input}`,
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'action_path_suggestion',
            strict: false,
            schema: RESPONSE_SCHEMA,
          },
        },
      }),
    })

    if (!openaiRes.ok) {
      const errText = await openaiRes.text()
      console.error('actionpath-ai openai error', openaiRes.status, errText.slice(0, 300))
      if (openaiRes.status === 429) {
        return fail('ActionPath AI is busy at the moment. Please try again shortly.', 503, {
          code: 'rate_limit',
        })
      }
      return fail(
        "We couldn't generate a suggestion right now. Please try again.",
        502,
        { code: 'api' },
      )
    }

    const completion = await openaiRes.json()
    const content = completion?.choices?.[0]?.message?.content
    if (typeof content !== 'string') {
      console.error('actionpath-ai: missing message content')
      return fail(
        "We couldn't read the AI suggestion properly. Please try again.",
        502,
        { code: 'malformed' },
      )
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(content)
    } catch {
      console.error('actionpath-ai: JSON parse failed', content.slice(0, 200))
      return fail(
        "We couldn't read the AI suggestion properly. Please try again.",
        502,
        { code: 'malformed' },
      )
    }

    const validated = validateSuggestion(parsed)
    if (!validated.ok) {
      console.error('actionpath-ai validation', validated.error)
      return fail(
        "We couldn't read the AI suggestion properly. Please try again.",
        502,
        { code: 'malformed' },
      )
    }

    return ok(validated.value)
  } catch (err) {
    console.error('actionpath-ai', err instanceof Error ? err.message : 'unknown')
    return fail("We couldn't generate a suggestion right now. Please try again.", 500, {
      code: 'api',
    })
  }
})
