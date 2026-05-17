import { Link } from 'react-router-dom'
import {
  Cpu,
  GraduationCap,
  HeartPulse,
  Leaf,
  Scale,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { movementsFilterUrl, type DiscoverCategoryCount } from '../../lib/discover'
import type { Category } from '../../types'
import { Skeleton } from '../Skeleton'
import DiscoverSectionShell from './DiscoverSectionShell'

const CATEGORY_ICONS: Record<Category, LucideIcon> = {
  Education: GraduationCap,
  Environment: Leaf,
  Technology: Cpu,
  Community: Users,
  Health: HeartPulse,
  Justice: Scale,
  Economy: TrendingUp,
  Other: Users,
}

const CARD_ACCENTS: Record<Category, string> = {
  Education: 'from-blue-500/10 to-blue-600/5 ring-blue-200/60',
  Environment: 'from-emerald-500/10 to-emerald-600/5 ring-emerald-200/60',
  Technology: 'from-violet-500/10 to-violet-600/5 ring-violet-200/60',
  Community: 'from-amber-500/10 to-amber-600/5 ring-amber-200/60',
  Health: 'from-rose-500/10 to-rose-600/5 ring-rose-200/60',
  Justice: 'from-purple-500/10 to-purple-600/5 ring-purple-200/60',
  Economy: 'from-orange-500/10 to-orange-600/5 ring-orange-200/60',
  Other: 'from-slate-500/10 to-slate-600/5 ring-slate-200/60',
}

interface Props {
  counts: DiscoverCategoryCount[]
  loading: boolean
}

export default function DiscoverCategoriesSection({ counts, loading }: Props) {
  const { t } = useTranslation()

  return (
    <DiscoverSectionShell
      eyebrow={t('discover.categoriesEyebrow')}
      title={t('discover.categoriesTitle')}
      subtitle={t('discover.categoriesSubtitle')}
    >
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 7 }).map((_, i) => (
              <li key={i}>
                <Skeleton className="h-28 rounded-2xl" />
              </li>
            ))
          : counts.map(({ category, count }) => {
              const Icon = CATEGORY_ICONS[category]
              return (
                <li key={category}>
                  <Link
                    to={movementsFilterUrl({ category })}
                    className={`group flex h-full min-h-[7rem] flex-col justify-between rounded-2xl bg-linear-to-br p-4 ring-1 transition hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500 ${CARD_ACCENTS[category]}`}
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 text-accent-700 shadow-sm ring-1 ring-black/5">
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <div>
                      <p className="font-bold text-primary group-hover:text-accent-700">{category}</p>
                      <p className="mt-0.5 text-xs text-secondary">
                        {count > 0
                          ? t('discover.categoryCount', { count })
                          : t('discover.categoryExplore')}
                      </p>
                    </div>
                  </Link>
                </li>
              )
            })}
      </ul>
    </DiscoverSectionShell>
  )
}
