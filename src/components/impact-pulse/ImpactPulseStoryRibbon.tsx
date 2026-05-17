import { ArrowRight, BadgeCheck, Megaphone, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const STEPS = [
  { key: 'voice', icon: Megaphone },
  { key: 'momentum', icon: Users },
  { key: 'action', icon: ArrowRight },
  { key: 'trust', icon: BadgeCheck },
] as const

export default function ImpactPulseStoryRibbon() {
  const { t } = useTranslation()

  return (
    <nav
      aria-label={t('impactPulse.story.aria')}
      className="mt-6 flex flex-wrap items-center gap-2"
    >
      {STEPS.map((step, index) => {
        const Icon = step.icon
        return (
          <span key={step.key} className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-surface/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
              <Icon className="h-3.5 w-3.5 shrink-0 text-accent-200" aria-hidden />
              {t(`impactPulse.story.${step.key}`)}
            </span>
            {index < STEPS.length - 1 && (
              <ArrowRight className="hidden h-3.5 w-3.5 text-white/40 sm:block" aria-hidden />
            )}
          </span>
        )
      })}
    </nav>
  )
}
