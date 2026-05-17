import type { ReliefFieldValues } from './reliefFieldValues'
import type { ReliefCreateSubtype } from './reliefHub'
import type { Category, MovementType } from '../types'
import { CATEGORIES } from '../types'
import { isPollMovement, MOVEMENT_TYPE_VALUES } from './movements'
import { POLL_OPTION_MAX, POLL_OPTION_MIN } from './polls'

export const POST_LIMITS = {
  titleMin: 3,
  titleMax: 120,
  descriptionMin: 20,
  /** Shorter minimum for Donation & Relief (structured fields carry detail). */
  reliefDescriptionMin: 10,
  descriptionMax: 2000,
  authorMin: 2,
  authorMax: 80,
  fieldMax: 500,
  shortMax: 200,
} as const

const FIELD_ERROR_LABELS: Record<string, string> = {
  title: 'Title',
  description: 'Description',
  category: 'Category',
  authorName: 'Author name',
  blood_group: 'Blood group',
  hospital_or_organizer: 'Hospital / organizer',
  donors_needed: 'Donors needed',
  contact_note: 'Contact note',
  items_needed: 'Items needed',
  beneficiary_group: 'Who will benefit',
  collection_location: 'Collection location',
  fundraising_goal_amount: 'Fundraising goal',
  fundraising_purpose: 'Purpose of funds',
  beneficiary_description: 'Beneficiary description',
  organizer_transparency_note: 'Transparency note',
  postingIdentity: 'Posting identity',
}

/** Human-readable summary for the form error banner (not a generic-only message). */
export function formatFieldErrorsSummary(errors: CreatePostFieldErrors): string {
  const entries = Object.entries(errors).filter(([, msg]) => Boolean(msg))
  if (entries.length === 0) return ''
  const lines = entries.map(([key, msg]) => {
    const label = FIELD_ERROR_LABELS[key] ?? key.replace(/_/g, ' ')
    return `${label}: ${msg}`
  })
  if (lines.length === 1) return lines[0]!
  return lines.slice(0, 4).join(' · ')
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function validateLogin(email: string, password: string): string | null {
  if (!email.trim()) return 'Email is required.'
  if (!isValidEmail(email)) return 'Enter a valid email address.'
  if (!password) return 'Password is required.'
  return null
}

export function validateSignup(
  name: string,
  email: string,
  password: string,
): string | null {
  if (!name.trim()) return 'Name is required.'
  if (name.trim().length < 2) return 'Name must be at least 2 characters.'
  if (!email.trim()) return 'Email is required.'
  if (!isValidEmail(email)) return 'Enter a valid email address.'
  if (!password) return 'Password is required.'
  if (password.length < 6) return 'Password must be at least 6 characters.'
  return null
}

export const PASSWORD_MIN_LENGTH = 6

export function validatePasswordReset(password: string, confirm: string): {
  password?: string
  confirm?: string
} {
  const errors: { password?: string; confirm?: string } = {}
  if (!password) {
    errors.password = 'Password is required.'
  } else if (password.length < PASSWORD_MIN_LENGTH) {
    errors.password = `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`
  }
  if (!confirm) {
    errors.confirm = 'Please confirm your password.'
  } else if (password && confirm !== password) {
    errors.confirm = 'Passwords do not match.'
  }
  return errors
}

export function hasPasswordResetErrors(errors: { password?: string; confirm?: string }): boolean {
  return Boolean(errors.password || errors.confirm)
}

export interface CreatePostFieldErrors {
  title?: string
  description?: string
  category?: string
  authorName?: string
  movementType?: string
  fundraising_goal_amount?: string
  fundraising_purpose?: string
  [key: string]: string | undefined
}

export function validateCreatePost(
  input: {
    title: string
    description: string
    category: string
    authorName: string
    postingIdentity?: 'profile' | 'youth_voice'
    movementType: MovementType
    fundraising_goal_amount?: string
    fundraising_purpose?: string
    petition_issue?: string
    petition_requested_change?: string
    petition_target_authority?: string
    petition_support_goal?: string
    petition_closing_date?: string
    pollOptions?: string[]
  },
  options?: { descriptionMin?: number },
): CreatePostFieldErrors {
  const descriptionMin = options?.descriptionMin ?? POST_LIMITS.descriptionMin
  const errors: CreatePostFieldErrors = {}
  const title = input.title.trim()
  const description = input.description.trim()
  const authorName = input.authorName.trim()
  let postingIdentity = input.postingIdentity ?? 'profile'

  if (input.movementType === 'fundraising') {
    postingIdentity = 'profile'
  }

  if (!MOVEMENT_TYPE_VALUES.includes(input.movementType)) {
    errors.movementType = 'Please select a movement type.'
  }

  const isPoll = isPollMovement(input.movementType)
  const isPetition = input.movementType === 'youth_petition'

  if (!title) {
    errors.title = isPoll
      ? 'Poll question is required.'
      : isPetition
        ? 'Petition title is required.'
        : 'Title is required.'
  }
  else if (title.length < POST_LIMITS.titleMin)
    errors.title = isPoll
      ? `Question must be at least ${POST_LIMITS.titleMin} characters.`
      : `Title must be at least ${POST_LIMITS.titleMin} characters.`
  else if (title.length > POST_LIMITS.titleMax)
    errors.title = isPoll
      ? `Question must be under ${POST_LIMITS.titleMax} characters.`
      : `Title must be under ${POST_LIMITS.titleMax} characters.`

  if (!isPoll && !isPetition) {
    if (!description) errors.description = 'Description is required.'
    else if (description.length < descriptionMin)
      errors.description = `Description must be at least ${descriptionMin} characters.`
    else if (description.length > POST_LIMITS.descriptionMax)
      errors.description = `Description must be under ${POST_LIMITS.descriptionMax} characters.`
  } else if (description.length > POST_LIMITS.descriptionMax) {
    errors.description = `Context must be under ${POST_LIMITS.descriptionMax} characters.`
  }

  if (!input.category) errors.category = 'Please select a category.'
  else if (!CATEGORIES.includes(input.category as Category))
    errors.category = 'Invalid category.'

  if (postingIdentity === 'profile') {
    if (!authorName) errors.authorName = 'Author name is required.'
    else if (authorName.length < POST_LIMITS.authorMin)
      errors.authorName = `Name must be at least ${POST_LIMITS.authorMin} characters.`
    else if (authorName.length > POST_LIMITS.authorMax)
      errors.authorName = `Name must be under ${POST_LIMITS.authorMax} characters.`
  }

  if (input.movementType === 'fundraising') {
    const goal = parseFloat(input.fundraising_goal_amount ?? '')
    if (!input.fundraising_goal_amount?.trim() || Number.isNaN(goal))
      errors.fundraising_goal_amount = 'Enter a valid fundraising goal amount.'
    else if (goal <= 0) errors.fundraising_goal_amount = 'Goal must be greater than zero.'
    if (!input.fundraising_purpose?.trim())
      errors.fundraising_purpose = 'Fundraising purpose is required.'
  }

  if (isPetition) {
    const issue = (input.petition_issue ?? '').trim()
    const change = (input.petition_requested_change ?? '').trim()
    const target = (input.petition_target_authority ?? '').trim()
    if (!issue) errors.petition_issue = 'Explain the problem that needs attention.'
    else if (issue.length < POST_LIMITS.descriptionMin) {
      errors.petition_issue = `Issue must be at least ${POST_LIMITS.descriptionMin} characters.`
    }
    if (!change) errors.petition_requested_change = 'State the change you are requesting.'
    else if (change.length < 10) {
      errors.petition_requested_change = 'Requested change must be at least 10 characters.'
    }
    if (!target) errors.petition_target_authority = 'Who is this petition addressed to?'
    const goalRaw = input.petition_support_goal?.trim()
    if (goalRaw) {
      const goal = parseInt(goalRaw, 10)
      if (Number.isNaN(goal) || goal <= 0) {
        errors.petition_support_goal = 'Support goal must be a positive whole number.'
      }
    }
    const closing = input.petition_closing_date?.trim()
    if (closing) {
      const today = new Date().toISOString().slice(0, 10)
      if (closing < today) {
        errors.petition_closing_date = 'Closing date must be today or in the future.'
      }
    }
  }

  if (isPoll) {
    const raw = input.pollOptions ?? []
    const trimmed = raw.map((o) => o.trim())
    if (trimmed.length < POLL_OPTION_MIN) {
      errors.pollOptions = `Add at least ${POLL_OPTION_MIN} options.`
    } else if (trimmed.length > POLL_OPTION_MAX) {
      errors.pollOptions = `Maximum ${POLL_OPTION_MAX} options allowed.`
    } else {
      const seen = new Set<string>()
      trimmed.forEach((opt, i) => {
        if (!opt) errors[`pollOption_${i}`] = 'Option cannot be empty.'
        else {
          const key = opt.toLowerCase()
          if (seen.has(key)) errors[`pollOption_${i}`] = 'Duplicate option.'
          seen.add(key)
        }
      })
    }
  }

  return errors
}

export function hasFieldErrors(errors: CreatePostFieldErrors): boolean {
  return Object.keys(errors).length > 0
}

export function validateReliefCreate(input: {
  title: string
  description: string
  category: string
  authorName: string
  postingIdentity?: 'profile' | 'youth_voice'
  subtype: ReliefCreateSubtype
  reliefFields: ReliefFieldValues
}): CreatePostFieldErrors {
  const movementType = input.subtype === 'fundraising' ? 'fundraising' : 'donation_relief'
  const base = validateCreatePost(
    {
      title: input.title,
      description: input.description,
      category: input.category,
      authorName: input.authorName,
      postingIdentity: input.postingIdentity,
      movementType,
      fundraising_goal_amount: input.reliefFields.fundraising_goal_amount,
      fundraising_purpose: input.reliefFields.fundraising_purpose,
    },
    { descriptionMin: POST_LIMITS.reliefDescriptionMin },
  )

  const errors: CreatePostFieldErrors = { ...base }

  if (input.subtype === 'blood_donation') {
    if (!input.reliefFields.blood_group?.trim()) errors.blood_group = 'Blood group is required.'
    if (!input.reliefFields.hospital_or_organizer?.trim()) {
      errors.hospital_or_organizer = 'Hospital or organizer name is required.'
    }
    if (!input.reliefFields.donors_needed?.trim()) {
      errors.donors_needed = 'Number of donors needed is required.'
    } else if (parseInt(input.reliefFields.donors_needed, 10) <= 0) {
      errors.donors_needed = 'Enter a valid number of donors.'
    }
    if (!input.reliefFields.contact_note?.trim()) {
      errors.contact_note = 'Contact information is required.'
    }
  }

  if (input.subtype === 'item_donation') {
    if (!input.reliefFields.items_needed?.trim()) errors.items_needed = 'List the items needed.'
    if (!input.reliefFields.beneficiary_group?.trim()) {
      errors.beneficiary_group = 'Who will benefit is required.'
    }
    if (!input.reliefFields.collection_location?.trim()) {
      errors.collection_location = 'Collection location is required.'
    }
    if (!input.reliefFields.contact_note?.trim()) {
      errors.contact_note = 'Contact information is required.'
    }
  }

  if (input.subtype === 'fundraising') {
    if (!input.reliefFields.organizer_transparency_note?.trim()) {
      errors.organizer_transparency_note = 'Organizer transparency note is required.'
    }
    if (!input.reliefFields.beneficiary_description?.trim()) {
      errors.beneficiary_description = 'Beneficiary description is required.'
    }
  }

  return errors
}
