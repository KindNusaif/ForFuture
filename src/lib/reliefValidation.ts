import type { ReliefCreateSubtype } from './reliefHub'
import { POST_LIMITS } from './validation'
import type { CreatePostFieldErrors } from './validation'

export function validateReliefCreate(input: {
  subtype: ReliefCreateSubtype
  title: string
  description: string
  category: string
  authorName: string
  postingIdentity: 'profile' | 'youth_voice'
  fields: Record<string, string>
}): CreatePostFieldErrors {
  const errors: CreatePostFieldErrors = {}
  const title = input.title.trim()
  const description = input.description.trim()

  if (!title) errors.title = 'Title is required.'
  else if (title.length < POST_LIMITS.titleMin) errors.title = `Title must be at least ${POST_LIMITS.titleMin} characters.`
  else if (title.length > POST_LIMITS.titleMax) errors.title = `Title must be under ${POST_LIMITS.titleMax} characters.`

  if (!description) errors.description = 'Description is required.'
  else if (description.length < POST_LIMITS.descriptionMin)
    errors.description = `Description must be at least ${POST_LIMITS.descriptionMin} characters.`

  if (input.postingIdentity === 'profile' && !input.authorName.trim()) {
    errors.authorName = 'Author name is required.'
  }

  if (input.subtype === 'fundraising' && input.postingIdentity === 'youth_voice') {
    errors.postingIdentity = 'Fundraising campaigns must be posted with your public profile.'
  }

  const f = input.fields

  if (input.subtype === 'blood_donation') {
    if (!f.blood_group) errors.blood_group = 'Blood group is required.'
    if (!f.hospital_or_organizer?.trim()) errors.hospital_or_organizer = 'Hospital or organizer is required.'
    if (!f.location?.trim() && !f.collection_location?.trim()) {
      errors.location = 'Location is required.'
    }
    if (!f.donors_needed?.trim()) errors.donors_needed = 'Number of donors needed is required.'
    else if (Number(f.donors_needed) < 1) errors.donors_needed = 'Enter at least 1 donor needed.'
    if (!f.contact_note?.trim()) errors.contact_note = 'Contact note is required.'
  }

  if (input.subtype === 'item_donation') {
    if (!f.items_needed?.trim()) errors.items_needed = 'Items needed is required.'
    if (!f.beneficiary_group?.trim()) errors.beneficiary_group = 'Who will benefit is required.'
    if (!f.collection_location?.trim()) errors.collection_location = 'Collection location is required.'
    if (!f.contact_note?.trim()) errors.contact_note = 'Contact note is required.'
  }

  if (input.subtype === 'fundraising') {
    const goal = Number(f.fundraising_goal_amount)
    if (!f.fundraising_goal_amount?.trim() || Number.isNaN(goal) || goal <= 0) {
      errors.fundraising_goal_amount = 'Enter a valid goal amount.'
    }
    if (!f.fundraising_purpose?.trim()) errors.fundraising_purpose = 'Purpose of funds is required.'
    if (!f.beneficiary_description?.trim()) errors.beneficiary_description = 'Beneficiary description is required.'
    if (!f.organizer_transparency_note?.trim()) {
      errors.organizer_transparency_note = 'Organizer transparency note is required.'
    }
  }

  return errors
}
