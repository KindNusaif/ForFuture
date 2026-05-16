import { BarChart3, HeartHandshake, Megaphone, Rocket, ScrollText, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ImpactPulseGlance } from '../../lib/impactPulse'
import MetricCard from './MetricCard'
import SectionShell from './SectionShell'

interface Props {
  glance: ImpactPulseGlance
  loading?: boolean
}

export default function ImpactPulseGlance({ glance, loading }: Props) {
  const { t } = useTranslation()

  const cards = [
    { icon: Megaphone, label: t('impactPulse.glance.voices'), value: glance.youth_voices_shared, accent: 'accent' as const },
    { icon: Rocket, label: t('impactPulse.glance.movements'), value: glance.movements_launched, accent: 'brand' as const },
    { icon: ScrollText, label: t('impactPulse.glance.petitions'), value: glance.petitions_started, accent: 'teal' as const },
    { icon: Users, label: t('impactPulse.glance.volunteer'), value: glance.volunteer_drives, accent: 'accent' as const },
    { icon: HeartHandshake, label: t('impactPulse.glance.relief'), value: glance.relief_causes, accent: 'teal' as const },
    { icon: BarChart3, label: t('impactPulse.glance.pollVotes'), value: glance.poll_votes, accent: 'brand' as const },
  ]

  return (
    <SectionShell
      id="impact-glance"
      title={t('impactPulse.glance.title')}
      subtitle={t('impactPulse.glance.subtitle')}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <MetricCard key={card.label} {...card} loading={loading} />
        ))}
      </div>
    </SectionShell>
  )
}
