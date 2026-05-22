/** Client-side validation before calling ActionPath AI (Edge Function mirrors these rules). */

export const ACTIONPATH_INPUT_MIN = 15
export const ACTIONPATH_INPUT_MAX = 1500

export type ActionPathValidationReason =
  | 'empty'
  | 'too_short'
  | 'too_long'
  | 'gibberish'
  | 'unclear'
  | 'blocklisted'

export type ActionPathValidationResult =
  | { valid: true; trimmed: string }
  | { valid: false; reason: ActionPathValidationReason }

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
  'lorem',
  'ipsum',
])

const WORD_PATTERN = /[\p{L}\p{M}]{3,}/gu

function stripForAnalysis(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
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

/** e.g. TETETETETE, HHHHH, GGGGGG */
function hasRepeatingSubstringSpam(text: string): boolean {
  const compact = text.replace(/\s/g, '').toLowerCase()
  if (/([a-z])\1{4,}/.test(compact)) return true
  if (/(.{2,6})\1{3,}/.test(compact)) return true
  return false
}

/** Real civic descriptions usually include spaces; long one-blob Latin text is spam. */
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
  const word = token.normalize('NFKC')
  if (word.length < 4) return false

  const lower = word.toLowerCase()
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
  const maxInWord = Math.max(...charCounts.values())
  if (maxInWord / lettersOnly.length > 0.45) return false

  return true
}

function hasMeaningfulWords(text: string): boolean {
  const hasNonLatin = /[^\u0000-\u024F]/u.test(text)
  if (hasNonLatin) {
    const words = [...text.matchAll(WORD_PATTERN)].map((m) => m[0])
    return words.length >= 2 || (words.length === 1 && words[0]!.length >= 6)
  }

  const words = [...text.matchAll(WORD_PATTERN)].map((m) => m[0])
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

function isBlocklistedPhrase(text: string): boolean {
  const normalized = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .trim()
  if (BLOCKLIST.has(normalized)) return true
  if (normalized.split(/\s+/).every((w) => BLOCKLIST.has(w))) return true
  return false
}

export function validateActionPathInput(raw: string): ActionPathValidationResult {
  const trimmed = stripForAnalysis(raw)

  if (!trimmed) return { valid: false, reason: 'empty' }
  if (trimmed.length < ACTIONPATH_INPUT_MIN) return { valid: false, reason: 'too_short' }
  if (trimmed.length > ACTIONPATH_INPUT_MAX) return { valid: false, reason: 'too_long' }
  if (isBlocklistedPhrase(trimmed)) return { valid: false, reason: 'blocklisted' }
  if (isRepeatedCharacterSpam(trimmed)) return { valid: false, reason: 'gibberish' }
  if (hasRepeatingSubstringSpam(trimmed)) return { valid: false, reason: 'gibberish' }
  if (isUnspacedKeyboardBlob(trimmed)) return { valid: false, reason: 'gibberish' }
  if (isKeyboardMash(trimmed)) return { valid: false, reason: 'gibberish' }
  if (!hasMeaningfulWords(trimmed)) return { valid: false, reason: 'unclear' }

  return { valid: true, trimmed }
}

export function isActionPathInputValid(raw: string): boolean {
  return validateActionPathInput(raw).valid
}
