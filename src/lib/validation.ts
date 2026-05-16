import type { Category, MovementType } from '../types'
import { CATEGORIES } from '../types'
import { isPollMovement, MOVEMENT_TYPE_VALUES } from './movements'
import { POLL_OPTION_MAX, POLL_OPTION_MIN } from './polls'

export const POST_LIMITS = {
  titleMin: 3,
  titleMax: 120,
  descriptionMin: 20,
  descriptionMax: 2000,
  authorMin: 2,
  authorMax: 80,
  fieldMax: 500,
  shortMax: 200,
} as const

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

export function validateCreatePost(input: {
  title: string
  description: string
  category: string
  authorName: string
  postingIdentity?: 'profile' | 'youth_voice'
  movementType: MovementType
  fundraising_goal_amount?: string
  fundraising_purpose?: string
  pollOptions?: string[]
}): CreatePostFieldErrors {
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

  if (!title) errors.title = isPoll ? 'Poll question is required.' : 'Title is required.'
  else if (title.length < POST_LIMITS.titleMin)
    errors.title = isPoll
      ? `Question must be at least ${POST_LIMITS.titleMin} characters.`
      : `Title must be at least ${POST_LIMITS.titleMin} characters.`
  else if (title.length > POST_LIMITS.titleMax)
    errors.title = isPoll
      ? `Question must be under ${POST_LIMITS.titleMax} characters.`
      : `Title must be under ${POST_LIMITS.titleMax} characters.`

  if (!isPoll) {
    if (!description) errors.description = 'Description is required.'
    else if (description.length < POST_LIMITS.descriptionMin)
      errors.description = `Description must be at least ${POST_LIMITS.descriptionMin} characters.`
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
