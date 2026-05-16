import { BarChart3, HeartHandshake, Megaphone, Rocket, ScrollText, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ImpactPulseGlance } from '../../lib/impactPulse'
import MetricCard from './MetricCard'
import SectionShell from './SectionShell'

interface Props {
  glance: ImpactPulseGlance
  loading?: boolean
  unavailable?: boolean
}

export default function ImpactPulseGlance({ glance, loading, unavailable }: Props) {
  const { t } = useTranslation()

  const primary = [
    {
      icon: Megaphone,
      label: t('impactPulse.glance.voices'),
      hint: t('impactPulse.glance.hints.voices'),
      value: glance.youth_voices_shared,
      accent: 'accent' as const,
    },
    {
      icon: Rocket,
      label: t('impactPulse.glance.movements'),
      hint: t('impactPulse.glance.hints.movements'),
      value: glance.movements_launched,
      accent: 'brand' as const,
    },
    {
      icon: ScrollText,
      label: t('impactPulse.glance.petitions'),
      hint: t('impactPulse.glance.hints.petitions'),
      value: glance.petitions_started,
      accent: 'teal' as const,
    },
    {
      icon: Users,
      label: t('impactPulse.glance.volunteer'),
      hint: t('impactPulse.glance.hints.volunteer'),
      value: glance.volunteer_drives,
      accent: 'accent' as const,
    },
  ]

  const secondary = [
    {
      icon: HeartHandshake,
      label: t('impactPulse.glance.relief'),
      hint: t('impactPulse.glance.hints.relief'),
      value: glance.relief_causes,
      accent: 'teal' as const,
    },
    {
      icon: BarChart3,
      label: t('impactPulse.glance.pollVotes'),
      hint: t('impactPulse.glance.hints.polls'),
      value: glance.poll_votes,
      accent: 'brand' as const,
    },
  ]

  return (
    <SectionShell
      id="impact-glance"
      title={t('impactPulse.glance.title')}
      subtitle={t('impactPulse.glance.subtitle')}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {primary.map((card) => (
          <MetricCard
            key={card.label}
            {...card}
            loading={loading}
            unavailable={unavailable}
          />
        ))}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {secondary.map((card) => (
          <MetricCard
            key={card.label}
            {...card}
            loading={loading}
            unavailable={unavailable}
            compact
          />
        ))}
      </div>
    </SectionShell>
  )
}
