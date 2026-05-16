/** Characters excluding ambiguous glyphs (0/O, 1/I/L) */
const CHARSET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
const PREFIX = 'YV-'
const SUFFIX_LENGTH = 5

export function generateYouthVoiceIdCandidate(): string {
  let suffix = ''
  const bytes = crypto.getRandomValues(new Uint8Array(SUFFIX_LENGTH))
  for (let i = 0; i < SUFFIX_LENGTH; i++) {
    suffix += CHARSET[bytes[i] % CHARSET.length]
  }
  return `${PREFIX}${suffix}`
}

/** Public label shown on posts, e.g. "Youth Voice YV-4K8P2" */
export function formatYouthVoiceLabel(youthVoiceId: string): string {
  return `Youth Voice ${youthVoiceId}`
}

export function isYouthVoiceIdFormat(value: string): boolean {
  return /^YV-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{5}$/.test(value)
}
