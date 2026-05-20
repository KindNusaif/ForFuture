import type { TFunction } from 'i18next'
import type { CreatePostFieldErrors } from './validation'

/** Map validation keys to user-friendly poll creation copy. */
export function mapPollFormErrors(errors: CreatePostFieldErrors, t: TFunction): CreatePostFieldErrors {
  const mapped: CreatePostFieldErrors = { ...errors }

  if (
    errors.title === 'Poll question is required.' ||
    errors.title === 'Title is required.' ||
    errors.title?.includes('required')
  ) {
    mapped.title = t('polls.questionRequired', { defaultValue: 'Please enter a poll question.' })
  }

  if (errors.pollOptions?.includes('at least') || errors.pollOptions?.includes('Add at least')) {
    mapped.pollOptions = t('polls.minOptionsError', { defaultValue: 'Add at least two answer options.' })
  }

  Object.keys(errors).forEach((key) => {
    if (key.startsWith('pollOption_')) {
      const msg = errors[key]
      if (msg === 'Option cannot be empty.') {
        mapped[key] = t('polls.createEmptyOptionError', { defaultValue: 'Poll options cannot be empty.' })
      } else if (msg === 'Duplicate option.') {
        mapped[key] = t('polls.duplicateOptionError', { defaultValue: 'This option already exists.' })
      }
    }
  })

  return mapped
}
