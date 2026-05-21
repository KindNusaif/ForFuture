import { CATEGORIES, type Category } from '../types'

/** Never call .map on unknown API data without this. */
export function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value : []
}

export function coerceCategory(raw: unknown): Category {
  if (typeof raw === 'string' && (CATEGORIES as readonly string[]).includes(raw)) {
    return raw as Category
  }
  return 'Other'
}

export function safeFormatShortDate(iso: string | null | undefined): string {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}

export function safeFormatLongDate(iso: string | null | undefined): string {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}

export function getDisplayName(
  profile: { display_name?: string | null } | null | undefined,
  fallback = 'ForFuture member',
): string {
  const name = profile?.display_name?.trim()
  return name || fallback
}
