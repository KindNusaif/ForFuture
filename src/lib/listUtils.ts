export function safeList<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : []
}

/** Merge list items by `id`; optional prepend when inserting new rows. */
export function upsertById<T extends { id: string }>(
  list: T[],
  item: T,
  options?: { prepend?: boolean },
): T[] {
  const safe = safeList(list)
  const index = safe.findIndex((row) => row.id === item.id)
  if (index >= 0) {
    const next = [...safe]
    next[index] = item
    return next
  }
  return options?.prepend ? [item, ...safe] : [...safe, item]
}

export function removeById<T extends { id: string }>(list: T[] | null | undefined, id: string): T[] {
  return safeList(list).filter((row) => row.id !== id)
}
