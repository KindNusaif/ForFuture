import type { ReliefFieldValues } from './reliefFieldValues'
import type { ReliefCreateSubtype } from './reliefHub'
import { POST_LIMITS } from './validation'

/** Build a publishable description from title + structured relief fields when the textarea is short. */
export function enrichReliefDescription(
  description: string,
  title: string,
  subtype: ReliefCreateSubtype,
  fields: ReliefFieldValues,
): string {
  const trimmed = description.trim()
  if (trimmed.length >= POST_LIMITS.reliefDescriptionMin) {
    return trimmed.slice(0, POST_LIMITS.descriptionMax)
  }

  const lines: string[] = []
  if (trimmed) lines.push(trimmed)
  if (title.trim()) lines.push(title.trim())

  if (subtype === 'blood_donation') {
    if (fields.hospital_or_organizer.trim()) {
      lines.push(`Location: ${fields.hospital_or_organizer.trim()}`)
    }
    if (fields.blood_group.trim()) {
      lines.push(`Blood group needed: ${fields.blood_group.trim()}`)
    }
    if (fields.donors_needed.trim()) {
      lines.push(`Donors needed: ${fields.donors_needed.trim()}`)
    }
    if (fields.contact_note.trim()) lines.push(fields.contact_note.trim())
  } else if (subtype === 'item_donation') {
    if (fields.items_needed.trim()) lines.push(`Items: ${fields.items_needed.trim()}`)
    if (fields.beneficiary_group.trim()) lines.push(`Beneficiary: ${fields.beneficiary_group.trim()}`)
    if (fields.collection_location.trim()) {
      lines.push(`Collection: ${fields.collection_location.trim()}`)
    }
    if (fields.contact_note.trim()) lines.push(fields.contact_note.trim())
  } else if (subtype === 'fundraising') {
    if (fields.fundraising_purpose.trim()) lines.push(fields.fundraising_purpose.trim())
    if (fields.beneficiary_description.trim()) lines.push(fields.beneficiary_description.trim())
  }

  const combined = [...new Set(lines.filter(Boolean))].join('\n\n').trim()
  return combined.slice(0, POST_LIMITS.descriptionMax)
}
