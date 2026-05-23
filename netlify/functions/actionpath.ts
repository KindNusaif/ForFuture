import type { Handler } from '@netlify/functions'

const MIN_PROMPT_LENGTH = 20
const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const SYSTEM_PROMPT = `You are ActionPath AI, part of ForFuture — a civic action platform for youth voices.
When a user describes a community problem or idea, you must respond with ONLY valid JSON
(no markdown, no code fences, no text outside JSON) in this exact structure:
{
  "movementType": "Voice | Petition | Volunteer Drive | Relief Appeal",
  "improvedTitle": "A clear, compelling title for the movement",
  "improvedMessage": "A stronger version of their message (2-3 sentences)",
  "nextSteps": ["Step 1", "Step 2", "Step 3"],
  "cause": "Education | Environment | Health | Community Safety | Relief | Youth Rights"
}
Reply in the user's language when possible, otherwise English.`

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: JSON_HEADERS, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: JSON_HEADERS, body: 'Method Not Allowed' }
  }

  try {
    const { prompt } = JSON.parse(event.body || '{}')

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < MIN_PROMPT_LENGTH) {
      return {
        statusCode: 400,
        headers: JSON_HEADERS,
        body: JSON.stringify({ error: 'Please describe your concern in more detail.' }),
      }
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      console.error('actionpath: OPENAI_API_KEY is not configured')
      return {
        statusCode: 503,
        headers: JSON_HEADERS,
        body: JSON.stringify({
          error: 'ActionPath AI could not generate a suggestion. Please try again.',
        }),
      }
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 1024,
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt.trim() },
        ],
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('OpenAI error:', response.status, JSON.stringify(data).slice(0, 400))
      return {
        statusCode: 502,
        headers: JSON_HEADERS,
        body: JSON.stringify({
          error: 'ActionPath AI could not generate a suggestion. Please try again.',
        }),
      }
    }

    const content = data.choices?.[0]?.message?.content
    if (typeof content !== 'string' || !content.trim()) {
      console.error('actionpath: missing message content')
      return {
        statusCode: 502,
        headers: JSON_HEADERS,
        body: JSON.stringify({
          error: 'ActionPath AI could not generate a suggestion. Please try again.',
        }),
      }
    }

    const clean = content
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()

    JSON.parse(clean)

    return {
      statusCode: 200,
      headers: JSON_HEADERS,
      body: JSON.stringify({ result: clean }),
    }
  } catch (err) {
    console.error('Function error:', err)
    return {
      statusCode: 500,
      headers: JSON_HEADERS,
      body: JSON.stringify({
        error: 'ActionPath AI could not generate a suggestion. Please try again.',
      }),
    }
  }
}
