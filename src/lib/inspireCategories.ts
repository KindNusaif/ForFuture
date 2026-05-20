import type { LucideIcon } from 'lucide-react'
import {
  BookOpen,
  Flame,
  Lightbulb,
  Rocket,
  Star,
  Trophy,
} from 'lucide-react'
import type { InspireCategory, InspireCategoryFilter } from '../types/inspire'

export interface InspireCategoryConfig {
  value: InspireCategory
  labelKey: string
  labelDefault: string
  badgeKey: string
  badgeDefault: string
  descriptionKey: string
  descriptionDefault: string
  icon: LucideIcon
  badgeClass: string
  submitKey: string
  submitDefault: string
}

export const INSPIRE_CATEGORIES: InspireCategoryConfig[] = [
  {
    value: 'achievement',
    labelKey: 'inspire.categories.achievement',
    labelDefault: 'Achievement',
    badgeKey: 'inspire.badges.achievement',
    badgeDefault: 'Achievement',
    descriptionKey: 'inspire.categories.achievementDesc',
    descriptionDefault: 'Celebrate milestones and progress',
    icon: Trophy,
    badgeClass: 'bg-amber-50 text-amber-900 ring-amber-200/80 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-800/50',
    submitKey: 'inspire.submit.achievement',
    submitDefault: 'Share Achievement',
  },
  {
    value: 'success_story',
    labelKey: 'inspire.categories.successStory',
    labelDefault: 'Success Story',
    badgeKey: 'inspire.badges.successStory',
    badgeDefault: 'Success Story',
    descriptionKey: 'inspire.categories.successStoryDesc',
    descriptionDefault: 'Share a real journey of effort and outcome',
    icon: Star,
    badgeClass: 'bg-emerald-50 text-emerald-900 ring-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-800/50',
    submitKey: 'inspire.submit.successStory',
    submitDefault: 'Share Success Story',
  },
  {
    value: 'motivation',
    labelKey: 'inspire.categories.motivation',
    labelDefault: 'Motivation / Lesson',
    badgeKey: 'inspire.badges.motivation',
    badgeDefault: 'Motivation',
    descriptionKey: 'inspire.categories.motivationDesc',
    descriptionDefault: 'Meaningful reflections and lessons',
    icon: Flame,
    badgeClass: 'bg-rose-50 text-rose-900 ring-rose-200/80 dark:bg-rose-950/40 dark:text-rose-200 dark:ring-rose-800/50',
    submitKey: 'inspire.submit.motivation',
    submitDefault: 'Share Reflection',
  },
  {
    value: 'entrepreneurship',
    labelKey: 'inspire.categories.entrepreneurship',
    labelDefault: 'Entrepreneurship Journey',
    badgeKey: 'inspire.badges.entrepreneurship',
    badgeDefault: 'Entrepreneurship',
    descriptionKey: 'inspire.categories.entrepreneurshipDesc',
    descriptionDefault: 'Startup journeys and social enterprise',
    icon: Rocket,
    badgeClass: 'bg-violet-50 text-violet-900 ring-violet-200/80 dark:bg-violet-950/40 dark:text-violet-200 dark:ring-violet-800/50',
    submitKey: 'inspire.submit.entrepreneurship',
    submitDefault: 'Share Journey',
  },
  {
    value: 'innovation',
    labelKey: 'inspire.categories.innovation',
    labelDefault: 'Innovation Idea',
    badgeKey: 'inspire.badges.innovation',
    badgeDefault: 'Innovation',
    descriptionKey: 'inspire.categories.innovationDesc',
    descriptionDefault: 'Ideas for solving community problems',
    icon: Lightbulb,
    badgeClass: 'bg-sky-50 text-sky-900 ring-sky-200/80 dark:bg-sky-950/40 dark:text-sky-200 dark:ring-sky-800/50',
    submitKey: 'inspire.submit.innovation',
    submitDefault: 'Share Idea',
  },
  {
    value: 'book_idea',
    labelKey: 'inspire.categories.bookIdea',
    labelDefault: 'Book Insight',
    badgeKey: 'inspire.badges.bookIdea',
    badgeDefault: 'Book Insight',
    descriptionKey: 'inspire.categories.bookIdeaDesc',
    descriptionDefault: 'Book takeaways and applied learning',
    icon: BookOpen,
    badgeClass: 'bg-indigo-50 text-indigo-900 ring-indigo-200/80 dark:bg-indigo-950/40 dark:text-indigo-200 dark:ring-indigo-800/50',
    submitKey: 'inspire.submit.bookIdea',
    submitDefault: 'Share Book Insight',
  },
]

export const INSPIRE_FILTER_CHIPS: { id: InspireCategoryFilter; labelKey: string; labelDefault: string }[] = [
  { id: 'all', labelKey: 'inspire.filters.all', labelDefault: 'All' },
  { id: 'achievement', labelKey: 'inspire.filters.achievement', labelDefault: 'Achievements' },
  { id: 'success_story', labelKey: 'inspire.filters.successStory', labelDefault: 'Success Stories' },
  { id: 'motivation', labelKey: 'inspire.filters.motivation', labelDefault: 'Motivation' },
  { id: 'entrepreneurship', labelKey: 'inspire.filters.entrepreneurship', labelDefault: 'Entrepreneurship' },
  { id: 'innovation', labelKey: 'inspire.filters.innovation', labelDefault: 'Innovation' },
  { id: 'book_idea', labelKey: 'inspire.filters.bookIdea', labelDefault: 'Books & Ideas' },
]

export function getInspireCategoryConfig(category: InspireCategory): InspireCategoryConfig {
  return INSPIRE_CATEGORIES.find((c) => c.value === category) ?? INSPIRE_CATEGORIES[0]
}

export function isInspireCategory(value: string | null | undefined): value is InspireCategory {
  return INSPIRE_CATEGORIES.some((c) => c.value === value)
}

export function buildInspireBody(
  category: InspireCategory,
  fields: Record<string, string>,
): string {
  const parts: string[] = []
  const push = (label: string, value?: string) => {
    const v = value?.trim()
    if (v) parts.push(`${label}\n${v}`)
  }

  switch (category) {
    case 'achievement':
      push('What I achieved', fields.achievement_what)
      push('Why it matters', fields.achievement_why)
      push('What I learned', fields.achievement_learned)
      break
    case 'success_story':
      push('Challenge', fields.story_challenge)
      push('Action taken', fields.story_action)
      push('Result', fields.story_result)
      push('Lesson for others', fields.story_lesson)
      break
    case 'motivation':
      push('Reflection', fields.reflection)
      push('What inspired this', fields.reflection_inspired_by)
      break
    case 'entrepreneurship':
      push('What I am building', fields.building)
      push('Problem being solved', fields.problem_solving)
      push('Challenge faced', fields.challenge_faced)
      push('Advice', fields.advice)
      break
    case 'innovation':
      push('Problem', fields.idea_problem)
      push('How it could work', fields.idea_how)
      push('Who benefits', fields.idea_benefit)
      break
    case 'book_idea':
      if (fields.book_title?.trim()) {
        parts.push(
          `Book: ${fields.book_title.trim()}${fields.book_author?.trim() ? ` by ${fields.book_author.trim()}` : ''}`,
        )
      }
      push('Standout idea', fields.book_standout)
      push('What I learned', fields.book_learned)
      push('How I would apply it', fields.book_apply)
      break
  }

  return parts.join('\n\n').trim()
}
