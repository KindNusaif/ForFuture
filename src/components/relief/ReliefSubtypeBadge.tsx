import { Droplet, HeartHandshake, Package } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ReliefCreateSubtype } from '../../lib/reliefHub'

const STYLES: Record<ReliefCreateSubtype, string> = {
  blood_donation: 'bg-rose-100 text-rose-900 ring-rose-200/80',
  item_donation: 'bg-amber-100 text-amber-900 ring-amber-200/80',
  fundraising: 'bg-sky-100 text-sky-900 ring-sky-200/80',
}

const ICONS = {
  blood_donation: Droplet,
  item_donation: Package,
  fundraising: HeartHandshake,
} as const

interface ReliefSubtypeBadgeProps {
  subtype: ReliefCreateSubtype
  size?: 'sm' | 'md'
}

export default function ReliefSubtypeBadge({ subtype, size = 'sm' }: ReliefSubtypeBadgeProps) {
  const { t } = useTranslation()
  const Icon = ICONS[subtype]
  const text = size === 'sm' ? 'text-[11px]' : 'text-xs'
  const icon = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'

  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-0.5 font-semibold ring-1 ${STYLES[subtype]} ${text}`}
    >
      <Icon className={`${icon} shrink-0`} aria-hidden />
      <span className="truncate">{t(`relief.subtypes.${subtype}.badge`)}</span>
    </span>
  )
}
