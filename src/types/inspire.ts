export type InspireCategory =
  | 'achievement'
  | 'success_story'
  | 'motivation'
  | 'entrepreneurship'
  | 'innovation'
  | 'book_idea'

export type InspirePostStatus = 'visible' | 'hidden' | 'removed'

export type InspireCategoryFilter = 'all' | InspireCategory

/** Structured fields stored in field_data JSONB */
export interface InspireFieldData {
  achievement_what?: string
  achievement_why?: string
  achievement_learned?: string
  story_challenge?: string
  story_action?: string
  story_result?: string
  story_lesson?: string
  reflection?: string
  reflection_inspired_by?: string
  building?: string
  problem_solving?: string
  challenge_faced?: string
  advice?: string
  idea_problem?: string
  idea_how?: string
  idea_benefit?: string
  book_title?: string
  book_author?: string
  book_standout?: string
  book_learned?: string
  book_apply?: string
}

export interface InspirePost {
  id: string
  user_id: string
  category: InspireCategory
  title: string
  body: string
  field_data: InspireFieldData
  could_become_movement: boolean
  status: InspirePostStatus
  created_at: string
  updated_at: string
  author_display_name?: string
  author_avatar_url?: string | null
  comment_count?: number
  saved_by_me?: boolean
}

export interface CreateInspirePostInput {
  category: InspireCategory
  title: string
  body: string
  field_data: InspireFieldData
  could_become_movement?: boolean
}

export interface UpdateInspirePostInput {
  title?: string
  body?: string
  field_data?: InspireFieldData
  could_become_movement?: boolean
}
