export const CATEGORIES = [
  'Education',
  'Environment',
  'Technology',
  'Community',
  'Health',
  'Justice',
  'Economy',
  'Other',
] as const

export type Category = (typeof CATEGORIES)[number]

export type PostingIdentity = 'profile' | 'youth_voice'

export type MovementType =
  | 'idea_for_change'
  | 'raise_voice'
  | 'volunteer_drive'
  | 'fundraising'
  | 'peaceful_civic_action'
  | 'quick_youth_poll'
  | 'youth_petition'

/** Civic engagement stored in post_actions */
export type PostActionType =
  | 'support_idea'
  | 'stand_with_voice'
  | 'volunteer_interest'
  | 'fundraising_support'
  | 'join_cause'

export interface PollOption {
  id: string
  post_id: string
  option_text: string
  sort_order: number
  vote_count: number
  percentage?: number
}

export interface PollVoteState {
  options: PollOption[]
  totalVotes: number
  myVoteOptionId: string | null
}

export type OrganizerVerificationType =
  | 'organization'
  | 'ngo'
  | 'student_society'
  | 'community_partner'

/** @deprecated Use OrganizerVerificationType */
export type OrganizationVerificationType =
  | OrganizerVerificationType
  | 'official_organization'

export type CampaignReviewStatus =
  | 'unreviewed'
  | 'under_review'
  | 'reviewed'
  | 'rejected'

export type ReviewedCampaignType =
  | 'fundraising'
  | 'volunteer_drive'
  | 'civic_campaign'
  | 'petition'
  | 'general_campaign'

/** @deprecated Use ReviewedCampaignType; civic_action kept for legacy view rows */
export type TrustedCampaignType =
  | ReviewedCampaignType
  | 'civic_action'

export interface Profile {
  id: string
  display_name: string
  youth_voice_id: string
  bio?: string | null
  avatar_url?: string | null
  created_at: string
  is_verified_organizer?: boolean
  organizer_verification_type?: OrganizerVerificationType | null
  organizer_verified_at?: string | null
  /** @deprecated Use is_verified_organizer */
  is_verified_organization?: boolean
  /** @deprecated Use organizer_verification_type */
  organization_verification_type?: OrganizationVerificationType | null
  /** @deprecated Use organizer_verified_at */
  verified_at?: string | null
  /** Platform moderation access — set only via Supabase SQL by administrators */
  is_admin?: boolean
}

export interface Post {
  id: string
  /** Null on Youth Voice posts in public feeds (owner profile may include it) */
  user_id: string | null
  title: string
  description: string
  category: Category
  author_name: string
  posting_identity: PostingIdentity
  /** Snapshot of the author's Youth Voice ID when posted anonymously */
  youth_voice_id: string | null
  movement_type: MovementType
  created_at: string
  support_count?: number
  supported_by_me?: boolean
  // Idea for Change
  proposed_solution?: string | null
  expected_impact?: string | null
  // Raise Your Voice
  issue_summary?: string | null
  desired_change?: string | null
  // Volunteer Drive
  event_date?: string | null
  event_time?: string | null
  location?: string | null
  volunteer_slots?: number | null
  contact_note?: string | null
  // Fundraising
  fundraising_goal_amount?: number | null
  fundraising_purpose?: string | null
  beneficiary_description?: string | null
  current_raised_amount?: number | null
  // Peaceful Civic Action
  action_date?: string | null
  action_time?: string | null
  action_location?: string | null
  action_purpose?: string | null
  safety_note?: string | null
  petition_issue?: string | null
  petition_requested_change?: string | null
  petition_target_authority?: string | null
  petition_support_goal?: number | null
  petition_closing_date?: string | null
  petition_impact_note?: string | null
  location_name?: string | null
  latitude?: number | null
  longitude?: number | null
  review_status?: CampaignReviewStatus
  reviewed_campaign_type?: ReviewedCampaignType | null
  reviewed_at?: string | null
  /** @deprecated Derived from review_status === 'reviewed' */
  is_trusted_campaign?: boolean
  /** @deprecated Use reviewed_campaign_type */
  trusted_campaign_type?: TrustedCampaignType | null
  /** @deprecated Use reviewed_at */
  trusted_at?: string | null
  author_is_verified_organizer?: boolean
  author_organizer_verification_type?: OrganizerVerificationType | null
  /** @deprecated Use author_is_verified_organizer */
  author_is_verified_organization?: boolean
  /** @deprecated Use author_organizer_verification_type */
  author_organization_verification_type?: OrganizationVerificationType | null
  /** Populated for quick_youth_poll movements */
  poll?: PollVoteState | null
}

/** Payload for creating a movement (post) */
export interface CreateMovementInput {
  userId: string
  title: string
  description: string
  category: Category
  authorName: string
  postingIdentity: PostingIdentity
  youthVoiceId: string
  movementType: MovementType
  proposed_solution?: string
  expected_impact?: string
  issue_summary?: string
  desired_change?: string
  event_date?: string
  event_time?: string
  location?: string
  volunteer_slots?: number | null
  contact_note?: string
  fundraising_goal_amount?: number | null
  fundraising_purpose?: string
  beneficiary_description?: string
  action_date?: string
  action_time?: string
  action_location?: string
  action_purpose?: string
  safety_note?: string
  petition_issue?: string
  petition_requested_change?: string
  petition_target_authority?: string
  petition_support_goal?: number | null
  petition_closing_date?: string
  petition_impact_note?: string
  location_name?: string
  latitude?: number | null
  longitude?: number | null
  pollOptions?: string[]
}
