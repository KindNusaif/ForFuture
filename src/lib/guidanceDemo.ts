import type { LucideIcon } from 'lucide-react'
import { BarChart3, BookOpen, HandHeart, ScrollText, Sparkles, Users } from 'lucide-react'

export interface PrototypeDemoItem {
  id: string
  icon: LucideIcon
  typeKey: string
  titleKey: string
  descriptionKey: string
  typeDefault: string
  titleDefault: string
  descriptionDefault: string
}

/** Static demo showcase copy — not loaded from the database. */
export const PROTOTYPE_DEMO_ITEMS: PrototypeDemoItem[] = [
  {
    id: 'poll',
    icon: BarChart3,
    typeKey: 'guidance.demo.types.poll',
    titleKey: 'guidance.demo.titles.poll',
    descriptionKey: 'guidance.demo.descriptions.poll',
    typeDefault: 'Community Poll',
    titleDefault: 'What should our town prioritize next?',
    descriptionDefault: 'Shows how communities can collect opinions before taking action.',
  },
  {
    id: 'petition',
    icon: ScrollText,
    typeKey: 'guidance.demo.types.petition',
    titleKey: 'guidance.demo.titles.petition',
    descriptionKey: 'guidance.demo.descriptions.petition',
    typeDefault: 'Petition',
    titleDefault: 'Safer school roads for every student',
    descriptionDefault: 'Shows how youth can turn a concern into a public campaign.',
  },
  {
    id: 'volunteer',
    icon: Users,
    typeKey: 'guidance.demo.types.volunteer',
    titleKey: 'guidance.demo.titles.volunteer',
    descriptionKey: 'guidance.demo.descriptions.volunteer',
    typeDefault: 'Volunteer Drive',
    titleDefault: 'Weekend neighborhood cleanup drive',
    descriptionDefault: 'Shows how people can organize real-world community action.',
  },
  {
    id: 'relief',
    icon: HandHeart,
    typeKey: 'guidance.demo.types.relief',
    titleKey: 'guidance.demo.titles.relief',
    descriptionKey: 'guidance.demo.descriptions.relief',
    typeDefault: 'Relief Campaign',
    titleDefault: 'Community flood relief and supply support',
    descriptionDefault: 'Shows how urgent needs can be shared and supported.',
  },
  {
    id: 'inspire',
    icon: Sparkles,
    typeKey: 'guidance.demo.types.inspire',
    titleKey: 'guidance.demo.titles.inspire',
    descriptionKey: 'guidance.demo.descriptions.inspire',
    typeDefault: 'Inspire Story',
    titleDefault: 'How one idea became a youth movement',
    descriptionDefault: 'Shows how progress and success stories can inspire others.',
  },
  {
    id: 'book',
    icon: BookOpen,
    typeKey: 'guidance.demo.types.book',
    titleKey: 'guidance.demo.titles.book',
    descriptionKey: 'guidance.demo.descriptions.book',
    typeDefault: 'Book Insight',
    titleDefault: 'One lesson that changed how I think about leadership',
    descriptionDefault: 'Shows how learning and ideas can support youth growth.',
  },
]

/**
 * Hide the prototype demo showcase when `VITE_SHOW_DEMO_EXAMPLES=false`.
 * Defaults to visible for prototype / judge flows.
 */
export function shouldShowPrototypeDemoSection(): boolean {
  const flag = import.meta.env.VITE_SHOW_DEMO_EXAMPLES
  if (flag === undefined || flag === '') return true
  return flag !== 'false' && flag !== '0'
}
