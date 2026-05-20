import { useTranslation } from 'react-i18next'
import { getInspireCategoryConfig } from '../../lib/inspireCategories'
import type { InspireCategory } from '../../types/inspire'

interface InspireCategoryBadgeProps {
  category: InspireCategory
  className?: string
}

export default function InspireCategoryBadge({ category, className = '' }: InspireCategoryBadgeProps) {
  const { t } = useTranslation()
  const config = getInspireCategoryConfig(category)
  const Icon = config.icon

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset ${config.badgeClass} ${className}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {t(config.badgeKey, { defaultValue: config.badgeDefault })}
    </span>
  )
}
