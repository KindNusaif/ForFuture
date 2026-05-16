import type { MovementType, Post } from '../types'

export type ReportableContentType = 'movement' | 'poll' | 'comment'

export type ContentReportReason =
  | 'misinformation'
  | 'abuse_harassment'
  | 'hate_discriminatory'
  | 'spam_scam'
  | 'privacy_violation'
  | 'threats_incitement'
  | 'other'

export type ContentReportStatus =
  | 'submitted'
  | 'under_review'
  | 'action_taken'
  | 'no_violation_found'
  | 'dismissed'

export type ContentReportPriority = 'high' | 'medium' | 'normal'

export interface ContentReportReasonOption {
  value: ContentReportReason
  label: string
  description: string
}

export const CONTENT_REPORT_REASONS: ContentReportReasonOption[] = [
  {
    value: 'misinformation',
    label: 'Misinformation',
    description: 'False or misleading claims presented as fact',
  },
  {
    value: 'abuse_harassment',
    label: 'Abuse or Harassment',
    description: 'Bullying, targeted harassment, or personal attacks',
  },
  {
    value: 'hate_discriminatory',
    label: 'Hate or Discriminatory Content',
    description: 'Attacks based on identity, protected characteristics, or group membership',
  },
  {
    value: 'spam_scam',
    label: 'Spam or Scam',
    description: 'Unwanted promotion, fraud, phishing, or deceptive solicitations',
  },
  {
    value: 'privacy_violation',
    label: 'Privacy Violation / Doxxing',
    description: 'Sharing private information without consent',
  },
  {
    value: 'threats_incitement',
    label: 'Threats or Incitement',
    description: 'Threats of harm or encouragement of violence',
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Another concern that should be reviewed by our team',
  },
]

export const CONTENT_REPORT_STATUS_LABELS: Record<ContentReportStatus, string> = {
  submitted: 'Report submitted',
  under_review: 'Under review',
  action_taken: 'Action taken',
  no_violation_found: 'No violation found',
  dismissed: 'Dismissed',
}

export const CONTENT_REPORT_PRIORITY_LABELS: Record<ContentReportPriority, string> = {
  high: 'High',
  medium: 'Medium',
  normal: 'Normal',
}

export function getReportableContentType(movementType: MovementType): ReportableContentType {
  return movementType === 'quick_youth_poll' ? 'poll' : 'movement'
}

export function getReportableContentTypeForPost(post: Post): ReportableContentType {
  return getReportableContentType(post.movement_type)
}

/** Client-side priority mirror (DB trigger is source of truth on insert). */
export function resolveReportPriority(reason: ContentReportReason): ContentReportPriority {
  switch (reason) {
    case 'threats_incitement':
    case 'privacy_violation':
    case 'spam_scam':
      return 'high'
    case 'abuse_harassment':
    case 'misinformation':
      return 'medium'
    default:
      return 'normal'
  }
}

export const MODERATION_FEATURE_BLURB =
  'ForFuture supports open civic expression while maintaining a safe and respectful community. Users can report harmful content, misinformation, abuse, scams, or privacy violations. Anonymous posts remain private to the public, while the platform retains internal accountability for moderation. Reports are reviewed rather than automatically removing content, helping reduce harm without suppressing legitimate youth voices.'
