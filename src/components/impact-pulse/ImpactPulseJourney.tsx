import { ArrowRight, BadgeCheck, HeartHandshake, Megaphone, ScrollText, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatImpactCountFull, type ImpactPulseJourney as JourneyData } from '../../lib/impactPulse'
import SectionShell from './SectionShell'
import { Skeleton } from '../Skeleton'

interface Props {
  journey: JourneyData
  loading?: boolean
  unavailable?: boolean
}

const STAGE_KEYS = [
  { key: 'voices', field: 'voices_raised' as const, icon: Megaphone },
  { key: 'petitions', field: 'petitions_created' as const, icon: ScrollText },
  { key: 'volunteer', field: 'volunteer_drives' as const, icon: Users },
  { key: 'relief', field: 'relief_causes' as const, icon: HeartHandshake },
  { key: 'trusted', field: 'trusted_reviewed' as const, icon: BadgeCheck },
]

export default function ImpactPulseJourney({ journey, loading, unavailable }: Props) {
  const { t } = useTranslation()
  const maxCount = Math.max(...STAGE_KEYS.map((s) => journey[s.field]), 1)

  return (
    <SectionShell
      id="voice-journey"
      title={t('impactPulse.journey.title')}
      subtitle={t('impactPulse.journey.subtitle')}
    >
      <div className="card-surface overflow-hidden bg-linear-to-br from-slate-900 via-brand-950 to-accent-950 p-6 text-white sm:p-8">
        <p className="max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">
          {t('impactPulse.journey.explainer')}
        </p>

        <ol
          className="relative mt-8 flex flex-col gap-3 lg:flex-row lg:items-stretch lg:gap-0"
          aria-label={t('impactPulse.journey.aria')}
        >
          <div
            className="pointer-events-none absolute left-5 top-10 bottom-10 w-px bg-surface/15 lg:left-[10%] lg:right-[10%] lg:top-[3.25rem] lg:bottom-auto lg:h-px lg:w-auto"
            aria-hidden
          />

          {STAGE_KEYS.map((stage, index) => {
            const Icon = stage.icon
            const count = journey[stage.field]
            const fill = unavailable ? 0 : Math.max(12, Math.round((count / maxCount) * 100))

            return (
              <li key={stage.key} className="relative flex min-w-0 flex-1 flex-col lg:px-1">
                <div className="flex min-w-0 flex-1 flex-col rounded-2xl border border-white/10 bg-surface/5 p-4 backdrop-blur-sm lg:mx-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-accent-300/90">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface/10 text-accent-200">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                  </div>

                  {loading ? (
                    <Skeleton className="mt-3 h-7 w-16 rounded-lg bg-surface/20" />
                  ) : unavailable ? (
                    <p className="mt-3 text-2xl font-extrabold text-white/40">—</p>
                  ) : (
                    <p className="mt-3 text-2xl font-extrabold tabular-nums">{formatImpactCountFull(count)}</p>
                  )}

                  <p className="mt-1 text-sm font-semibold leading-snug text-white/90">
                    {t(`impactPulse.journey.stages.${stage.key}`)}
                  </p>

                  {!loading && !unavailable && (
                    <div
                      className="mt-3 h-1 overflow-hidden rounded-full bg-surface/10"
                      role="presentation"
                      aria-hidden
                    >
                      <div
                        className="h-full rounded-full bg-linear-to-r from-accent-400 to-brand-400 transition-all duration-700"
                        style={{ width: `${fill}%` }}
                      />
                    </div>
                  )}
                </div>

                {index < STAGE_KEYS.length - 1 && (
                  <span
                    className="mx-auto my-1 flex h-6 items-center justify-center text-white/35 lg:hidden"
                    aria-hidden
                  >
                    <ArrowRight className="h-4 w-4 rotate-90" />
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
