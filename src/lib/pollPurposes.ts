import type { Category } from '../types'

export type PollPurposeId = 'priority' | 'decision' | 'opinion' | 'feedback'

export interface PollPurposeOption {
  id: PollPurposeId
  labelKey: string
  labelDefault: string
  badgeKey: string
  badgeDefault: string
  category: Category
}

/** Stored in posts.issue_summary for quick_youth_poll movements. */
export const POLL_PURPOSES: PollPurposeOption[] = [
  {
    id: 'priority',
    labelKey: 'polls.purpose.priority',
    labelDefault: 'Community Priority',
    badgeKey: 'polls.purposeBadge.priority',
    badgeDefault: 'Priority',
    category: 'Community',
  },
  {
    id: 'decision',
    labelKey: 'polls.purpose.decision',
    labelDefault: 'Movement Decision',
    badgeKey: 'polls.purposeBadge.decision',
    badgeDefault: 'Decision',
    category: 'Community',
  },
  {
    id: 'opinion',
    labelKey: 'polls.purpose.opinion',
    labelDefault: 'Public Opinion',
    badgeKey: 'polls.purposeBadge.opinion',
    badgeDefault: 'Opinion',
    category: 'Justice',
  },
  {
    id: 'feedback',
    labelKey: 'polls.purpose.feedback',
    labelDefault: 'Event / Volunteer Feedback',
    badgeKey: 'polls.purposeBadge.feedback',
    badgeDefault: 'Feedback',
    category: 'Community',
  },
]

const purposeById = new Map(POLL_PURPOSES.map((p) => [p.id, p]))

export function isPollPurposeId(value: string | null | undefined): value is PollPurposeId {
  return Boolean(value && purposeById.has(value as PollPurposeId))
}

export function getPollPurpose(id: string | null | undefined): PollPurposeOption | null {
  if (!isPollPurposeId(id)) return null
  return purposeById.get(id) ?? null
}

export function categoryForPollPurpose(id: PollPurposeId | ''): Category {
  if (!id) return 'Community'
  return purposeById.get(id)?.category ?? 'Community'
}
