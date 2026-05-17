import type { CreatePostFieldErrors } from './validation'

const FIELD_SCROLL_ORDER: { key: string; id: string }[] = [
  { key: 'movementType', id: 'movementType' },
  { key: 'title', id: 'title' },
  { key: 'description', id: 'description' },
  { key: 'category', id: 'category' },
  { key: 'authorName', id: 'authorName' },
  { key: 'fundraising_goal_amount', id: 'fundraising_goal_amount' },
  { key: 'fundraising_purpose', id: 'fundraising_purpose' },
  { key: 'petition_issue', id: 'petition_issue' },
  { key: 'petition_requested_change', id: 'petition_requested_change' },
  { key: 'petition_target_authority', id: 'petition_target_authority' },
  { key: 'pollOptions', id: 'poll-option-0' },
  { key: 'blood_group', id: 'blood_group' },
  { key: 'hospital_or_organizer', id: 'hospital_or_organizer' },
  { key: 'urgency_level', id: 'urgency_level' },
  { key: 'donors_needed', id: 'donors_needed' },
  { key: 'contact_note', id: 'contact_note' },
  { key: 'items_needed', id: 'items_needed' },
  { key: 'beneficiary_group', id: 'beneficiary_group' },
  { key: 'collection_location', id: 'collection_location' },
  { key: 'fundraising_goal_amount', id: 'fundraising_goal_amount' },
  { key: 'organizer_transparency_note', id: 'organizer_transparency_note' },
  { key: 'beneficiary_description', id: 'beneficiary_description' },
]

export function scrollToFirstFieldError(errors: CreatePostFieldErrors): void {
  for (const { key, id } of FIELD_SCROLL_ORDER) {
    if (errors[key]) {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
  }

  const pollKey = Object.keys(errors).find((k) => k.startsWith('pollOption_'))
  if (pollKey) {
    const index = pollKey.replace('pollOption_', '')
    document.getElementById(`poll-option-${index}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    return
  }

  const movementKey = Object.keys(errors).find((k) => !FIELD_SCROLL_ORDER.some((f) => f.key === k))
  if (movementKey) {
    document.getElementById(movementKey)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}
