import { ArrowRight, BadgeCheck, HeartHandshake, Megaphone, ScrollText, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatImpactCountFull, type ImpactPulseJourney as JourneyData } from '../../lib/impactPulse'
import SectionShell from './SectionShell'
import { Skeleton } from '../Skeleton'

interface Props {
  journey: JourneyData
  loading?: boolean
}

const STAGE_KEYS = [
  { key: 'voices', field: 'voices_raised' as const, icon: Megaphone },
  { key: 'petitions', field: 'petitions_created' as const, icon: ScrollText },
  { key: 'volunteer', field: 'volunteer_drives' as const, icon: Users },
  { key: 'relief', field: 'relief_causes' as const, icon: HeartHandshake },
  { key: 'trusted', field: 'trusted_reviewed' as const, icon: BadgeCheck },
]

export default function ImpactPulseJourney({ journey, loading }: Props) {
  const { t } = useTranslation()

  return (
    <SectionShell
      id="voice-journey"
      title={t('impactPulse.journey.title')}
      subtitle={t('impactPulse.journey.subtitle')}
    >
      <div className="card-surface overflow-hidden bg-linear-to-br from-slate-900 via-brand-950 to-accent-950 p-6 text-white sm:p-8">
        <p className="max-w-2xl text-sm leading-relaxed text-slate-200 sm:text-base">
          {t('impactPulse.journey.explainer')}
        </p>

        <ol className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-2">
          {STAGE_KEYS.map((stage, index) => {
            const Icon = stage.icon
            const count = journey[stage.field]
            return (
              <li key={stage.key} className="flex min-w-0 flex-1 flex-col lg:flex-row lg:items-center">
                <div className="flex min-w-0 flex-1 flex-col rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-accent-200">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  {loading ? (
                    <Skeleton className="mt-3 h-7 w-16 rounded-lg bg-white/20" />
                  ) : (
                    <p className="mt-3 text-2xl font-extrabold tabular-nums">
                      {formatImpactCountFull(count)}
                    </p>
                  )}
                  <p className="mt-1 text-sm font-semibold text-white/90">
                    {t(`impactPulse.journey.stages.${stage.key}`)}
                  </p>
                </div>
                {index < STAGE_KEYS.length - 1 && (
                  <span
                    className="mx-auto my-1 flex h-8 items-center justify-center text-white/40 lg:mx-0 lg:my-0 lg:h-auto lg:w-8 lg:shrink-0"
                    aria-hidden
                  >
                    <ArrowRight className="h-5 w-5 rotate-90 lg:rotate-0" />
                  </span>
                )}
              </li>
            )
          })}
        </ol>
      </div>
    </SectionShell>
  )
}
