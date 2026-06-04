import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const INPUT_MIN = 20
const INPUT_MAX = 1500
const COOLDOWN_MS = 30_000
const MAX_PER_HOUR = 15
const HOUR_MS = 60 * 60 * 1000

const DISPLAY_TYPES = [
  'Raise Your Voice',
  'Petition',
  'Volunteer Drive',
  'Donation & Relief Need',
  'Fundraising Campaign',
  'Quick Poll',
] as const

type DisplayType = (typeof DISPLAY_TYPES)[number]

type ApiSuggestion = {
  recommendedType: DisplayType
  title: string
  summary: string
  whyItMatters: string
  recommendedNextSteps: string[]
}

const SYSTEM_PROMPT = `You are ActionPath AI for ForFuture — a youth civic-action platform in Sri Lanka and beyond.

Turn the user's rough concern into a clear civic action draft they can review before publishing.

Return valid JSON only. No markdown. No code fences. No text outside the JSON object.

Use exactly this schema:
{
  "recommendedType": "<one label from the list below>",
  "title": "<clear improved title, under 120 characters>",
  "summary": "<clear improved summary, under 600 characters>",
  "whyItMatters": "<1-3 sentences on why this matters to the community>",
  "recommendedNextSteps": ["<step 1>", "<step 2>", "<step 3>"]
}

recommendedType must be exactly one of these labels (copy exactly):
- Raise Your Voice
- Petition
- Volunteer Drive
- Donation & Relief Need
- Fundraising Campaign
- Quick Poll

Rules:
- recommendedNextSteps must contain 3 to 5 practical, realistic steps.
- Keep language respectful, constructive, and youth-friendly.
- Do not invent specific names, hospitals, amounts, dates, or authorities unless the user provided them.
- Match the user's language when clear (English, Tamil, Sinhala); otherwise English.
- Never refuse; always return a useful draft when input is valid.`

const FRIENDLY_ERROR =
  'ActionPath AI could not generate a suggestion. Please try again.'

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

type ErrorCode = 'invalid_input' | 'auth' | 'config' | 'rate_limit' | 'api' | 'openai_rate_limit'

function fail(message: string, status = 400, code?: ErrorCode, retryAfterSec?: number) {
  // Return 200 for app errors so Supabase JS client always delivers JSON in `data`.
  const httpStatus = status === 401 ? 401 : 200
  return jsonResponse(
    {
      ok: false,
      error: message,
      ...(code ? { code } : {}),
      ...(retryAfterSec != null && retryAfterSec > 0 ? { retry_after_sec: retryAfterSec } : {}),
    },
    httpStatus,
  )
}

function success(suggestion: ApiSuggestion) {
  return jsonResponse({ ok: true, suggestion })
}

function normalizeDisplayType(raw: unknown): DisplayType | null {
  if (typeof raw !== 'string' || !raw.trim()) return null
  const trimmed = raw.trim()
  const exact = DISPLAY_TYPES.find((t) => t === trimmed)
  if (exact) return exact

  const lower = trimmed.toLowerCase()
  const aliases: Record<string, DisplayType> = {
    'raise your voice': 'Raise Your Voice',
    youth_voice: 'Raise Your Voice',
    raise_voice: 'Raise Your Voice',
    voice: 'Raise Your Voice',
    'relief appeal': 'Donation & Relief Need',
    petition: 'Petition',
    'youth petition': 'Petition',
    youth_petition: 'Petition',
    'volunteer drive': 'Volunteer Drive',
    volunteer_drive: 'Volunteer Drive',
    volunteer: 'Volunteer Drive',
    'donation & relief need': 'Donation & Relief Need',
    'donation and relief need': 'Donation & Relief Need',
    'relief appeal': 'Donation & Relief Need',
    relief_campaign: 'Donation & Relief Need',
    donation_relief: 'Donation & Relief Need',
    relief: 'Donation & Relief Need',
    'fundraising campaign': 'Fundraising Campaign',
    fundraising: 'Fundraising Campaign',
    'quick poll': 'Quick Poll',
    poll: 'Quick Poll',
    quick_youth_poll: 'Quick Poll',
    'community poll': 'Quick Poll',
  }
  if (aliases[lower]) return aliases[lower]
  if (lower.includes('petition')) return 'Petition'
  if (lower.includes('volunteer')) return 'Volunteer Drive'
  if (lower.includes('relief') || lower.includes('donation')) return 'Donation & Relief Need'
  if (lower.includes('fundrais')) return 'Fundraising Campaign'
  if (lower.includes('poll')) return 'Quick Poll'
  if (lower.includes('voice')) return 'Raise Your Voice'
  return null
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
    return { ok: false, message: 'Please describe your concern in more detail.' }
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

function parseModelJson(content: string): unknown {
  const clean = content
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
  return JSON.parse(clean)
}

function validateAiSuggestion(data: unknown): { ok: true; value: ApiSuggestion } | { ok: false } {
  if (!data || typeof data !== 'object') return { ok: false }

  const o = data as Record<string, unknown>
  const recommendedType = normalizeDisplayType(
    o.recommendedType ?? o.movementType ?? o.movement_type,
  )
  if (!recommendedType) return { ok: false }

  const title =
    typeof o.title === 'string'
      ? o.title.trim()
      : typeof o.improvedTitle === 'string'
        ? o.improvedTitle.trim()
        : typeof o.suggestedTitle === 'string'
          ? o.suggestedTitle.trim()
          : typeof o.improved_title === 'string'
            ? o.improved_title.trim()
            : ''
  const summary =
    typeof o.summary === 'string'
      ? o.summary.trim()
      : typeof o.improvedMessage === 'string'
        ? o.improvedMessage.trim()
        : typeof o.refinedSummary === 'string'
          ? o.refinedSummary.trim()
          : typeof o.improved_description === 'string'
            ? o.improved_description.trim()
            : ''
  let whyItMatters =
    typeof o.whyItMatters === 'string'
      ? o.whyItMatters.trim()
      : typeof o.why_it_matters === 'string'
        ? o.why_it_matters.trim()
        : typeof o.recommendation_reason === 'string'
          ? o.recommendation_reason.trim()
          : ''

  const stepsRaw =
    o.recommendedNextSteps ?? o.nextSteps ?? o.next_steps ?? o.suggested_action_steps
  if (!title || !summary) return { ok: false }
  if (!whyItMatters) whyItMatters = summary.slice(0, 500)
  if (!Array.isArray(stepsRaw)) return { ok: false }

  const recommendedNextSteps = stepsRaw
    .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
    .map((s) => s.trim())
    .slice(0, 5)
  if (recommendedNextSteps.length < 3) return { ok: false }

  return {
    ok: true,
    value: {
      recommendedType,
      title: title.slice(0, 120),
      summary: summary.slice(0, 600),
      whyItMatters: whyItMatters.slice(0, 500),
      recommendedNextSteps,
    },
  }
}

type RateLimitRpcResult = {
  allowed?: boolean
  retry_after_sec?: number
  reason?: 'cooldown' | 'hourly'
  message?: string
}

/** Cooldown uses last_request_at, updated only after a successful AI response (Postgres RPC). */
async function checkRateLimit(
  admin: ReturnType<typeof createClient>,
  userId: string,
): Promise<
  | { allowed: true }
  | { allowed: false; retryAfterSec: number; reason: 'cooldown' | 'hourly'; message: string }
> {
  try {
    const { data, error } = await admin.rpc('actionpath_ai_check_rate_limit', {
      p_user_id: userId,
    })

    if (error) {
      console.error('actionpath-ai rate limit rpc', error.message)
      return await checkRateLimitFallback(admin, userId)
    }

    const result = (data ?? {}) as RateLimitRpcResult
    if (result.allowed !== false) return { allowed: true }

    const retryAfterSec = Math.max(1, Math.ceil(Number(result.retry_after_sec) || COOLDOWN_MS / 1000))
    const message =
      typeof result.message === 'string' && result.message.trim()
        ? result.message.trim()
        : `Please wait ${retryAfterSec} seconds before generating again.`

    return {
      allowed: false,
      retryAfterSec,
      reason: result.reason === 'hourly' ? 'hourly' : 'cooldown',
      message,
    }
  } catch (err) {
    console.error('actionpath-ai rate limit', err instanceof Error ? err.message : 'unknown')
    return { allowed: true }
  }
}

/** Fallback if RPC is not deployed yet (direct table read). */
async function checkRateLimitFallback(
  admin: ReturnType<typeof createClient>,
  userId: string,
): Promise<
  | { allowed: true }
  | { allowed: false; retryAfterSec: number; reason: 'cooldown' | 'hourly'; message: string }
> {
  const now = new Date()
  const { data: row, error: selectError } = await admin
    .from('actionpath_ai_usage')
    .select('window_start, request_count, last_request_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (selectError) return { allowed: true }

  if (row?.last_request_at) {
    const last = new Date(row.last_request_at).getTime()
    if (now.getTime() - last < COOLDOWN_MS) {
      const retryAfterSec = Math.ceil((COOLDOWN_MS - (now.getTime() - last)) / 1000)
      return {
        allowed: false,
        retryAfterSec,
        reason: 'cooldown',
        message: `Please wait ${retryAfterSec} seconds before generating again.`,
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
    const retryAfterSec = Math.max(60, Math.ceil((resetAt - now.getTime()) / 1000))
    const mins = Math.max(1, Math.ceil(retryAfterSec / 60))
    return {
      allowed: false,
      retryAfterSec,
      reason: 'hourly',
      message: `You've used ActionPath AI many times this hour. Try again in about ${mins} minutes.`,
    }
  }

  return { allowed: true }
}

/** Only successful generations count toward hourly limits and cooldown. */
async function recordRateLimitSuccess(
  admin: ReturnType<typeof createClient>,
  userId: string,
): Promise<void> {
  try {
    const { error } = await admin.rpc('actionpath_ai_record_success', { p_user_id: userId })
    if (!error) return
    console.error('actionpath-ai record rpc', error.message)
  } catch (err) {
    console.error('actionpath-ai record rpc', err instanceof Error ? err.message : 'unknown')
  }

  try {
    const now = new Date()
    const { data: row } = await admin
      .from('actionpath_ai_usage')
      .select('window_start, request_count')
      .eq('user_id', userId)
      .maybeSingle()

    let windowStart = row?.window_start ? new Date(row.window_start) : now
    let count = row?.request_count ?? 0
    if (now.getTime() - windowStart.getTime() > HOUR_MS) {
      windowStart = now
      count = 0
    }

    const { error: upsertError } = await admin.from('actionpath_ai_usage').upsert({
      user_id: userId,
      window_start: windowStart.toISOString(),
      request_count: count + 1,
      last_request_at: now.toISOString(),
    })
    if (upsertError) {
      console.error('actionpath-ai rate limit success', upsertError.message)
    }
  } catch (err) {
    console.error('actionpath-ai rate limit success', err instanceof Error ? err.message : 'unknown')
  }
}

Deno.serve(async (req) => {
  try {
    return await handleActionPathRequest(req)
  } catch (err) {
    console.error(
      'actionpath-ai unhandled',
      err instanceof Error ? err.message : String(err),
      err instanceof Error ? err.stack : '',
    )
    return fail(FRIENDLY_ERROR, 500, 'api')
  }
})

async function handleActionPathRequest(req: Request): Promise<Response> {
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
    return fail(FRIENDLY_ERROR, 503, 'config')
  }

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    console.error('actionpath-ai: missing Supabase env')
    return fail(FRIENDLY_ERROR, 500, 'config')
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return fail('Sign in to use ActionPath AI.', 401, 'auth')
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser()

  if (userError || !user) {
    return fail('Sign in to use ActionPath AI.', 401, 'auth')
  }

  let body: { input?: unknown; prompt?: unknown }
  try {
    body = await req.json()
  } catch {
    return fail('Invalid request. Please try again.', 400, 'invalid_input')
  }

  const raw =
    typeof body.input === 'string'
      ? body.input
      : typeof body.prompt === 'string'
        ? body.prompt
        : ''
  const input = raw.trim()
  const inputCheck = validateUserInput(input)
  if (!inputCheck.ok) {
    return fail(inputCheck.message, 400, 'invalid_input')
  }

  const admin = createClient(supabaseUrl, serviceRoleKey)
  const rate = await checkRateLimit(admin, user.id)
  if (!rate.allowed) {
    return fail(rate.message, 429, 'rate_limit', rate.retryAfterSec)
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
        max_tokens: 1024,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: `User concern:\n${input}`,
          },
        ],
        response_format: { type: 'json_object' },
      }),
    })

    const openaiRaw = await openaiRes.text()
    let openaiData: Record<string, unknown> | null = null
    try {
      openaiData = openaiRaw ? (JSON.parse(openaiRaw) as Record<string, unknown>) : null
    } catch {
      console.error('actionpath-ai openai non-json body', openaiRes.status, openaiRaw.slice(0, 500))
    }

    console.log('OpenAI status:', openaiRes.status)
    console.log('OpenAI response:', JSON.stringify(openaiData ?? { raw: openaiRaw.slice(0, 500) }))

    if (!openaiRes.ok) {
      const oaiErr = openaiData?.error as { message?: string } | undefined
      const oaiMsg =
        typeof oaiErr?.message === 'string'
          ? oaiErr.message
          : openaiRaw.slice(0, 200) || 'OpenAI request failed'
      if (openaiRes.status === 429) {
        return fail(
          'OpenAI rate limit reached. Please wait a moment and try again.',
          503,
          'openai_rate_limit',
        )
      }
      console.error('actionpath-ai openai error', openaiRes.status, oaiMsg)
      return fail(
        openaiRes.status >= 500
          ? 'ActionPath AI is temporarily unavailable. Please try again shortly.'
          : FRIENDLY_ERROR,
        502,
        'api',
      )
    }

    const completion = openaiData
    const content = (completion?.choices as Array<{ message?: { content?: string } }> | undefined)?.[0]
      ?.message?.content
    if (typeof content !== 'string' || !content.trim()) {
      console.error('actionpath-ai: missing message content', JSON.stringify(completion).slice(0, 400))
      return fail(FRIENDLY_ERROR, 502, 'api')
    }

    let parsed: unknown
    try {
      parsed = parseModelJson(content)
    } catch {
      console.error('actionpath-ai: JSON parse failed', content.slice(0, 200))
      return fail(FRIENDLY_ERROR, 502, 'api')
    }

    const validated = validateAiSuggestion(parsed)
    if (!validated.ok) {
      console.error('actionpath-ai validation failed', JSON.stringify(parsed).slice(0, 400))
      return fail(FRIENDLY_ERROR, 502, 'api')
    }

    await recordRateLimitSuccess(admin, user.id)
    return success(validated.value)
  } catch (err) {
    console.error('actionpath-ai', err instanceof Error ? err.message : 'unknown')
    return fail(FRIENDLY_ERROR, 500, 'api')
  }
}
