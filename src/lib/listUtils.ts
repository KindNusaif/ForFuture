/** Merge list items by `id`; optional prepend when inserting new rows. */
export function upsertById<T extends { id: string }>(
  list: T[],
  item: T,
  options?: { prepend?: boolean },
): T[] {
  const index = list.findIndex((row) => row.id === item.id)
  if (index >= 0) {
    const next = [...list]
    next[index] = item
    return next
  }
  return options?.prepend ? [item, ...list] : [...list, item]
}

export function removeById<T extends { id: string }>(list: T[], id: string): T[] {
  return list.filter((row) => row.id !== id)
}
