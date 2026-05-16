import { Droplets, Heart, ScrollText, ThumbsUp, Users, Vote } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ImpactPulseParticipation as ParticipationData } from '../../lib/impactPulse'
import MetricCard from './MetricCard'
import SectionShell from './SectionShell'

interface Props {
  participation: ParticipationData
  loading?: boolean
  unavailable?: boolean
}

export default function ImpactPulseParticipation({ participation, loading, unavailable }: Props) {
  const { t } = useTranslation()

  const reliefResponses = participation.relief_blood + participation.relief_items

  const cards = [
    { icon: Vote, label: t('impactPulse.participation.pollVotes'), value: participation.poll_votes },
    {
      icon: ScrollText,
      label: t('impactPulse.participation.signatures'),
      value: participation.petition_signatures,
    },
    {
      icon: Users,
      label: t('impactPulse.participation.volunteer'),
      value: participation.volunteer_responses,
    },
    {
      icon: ThumbsUp,
      label: t('impactPulse.participation.supports'),
      value: participation.movement_supports,
    },
    {
      icon: Droplets,
      label: t('impactPulse.participation.relief'),
      hint: t('impactPulse.participation.reliefHint'),
      value: reliefResponses,
    },
    {
      icon: Heart,
      label: t('impactPulse.participation.fundraising'),
      value: participation.fundraising_support,
    },
  ]

  return (
    <SectionShell
      id="participation"
      title={t('impactPulse.participation.title')}
      subtitle={t('impactPulse.participation.subtitle')}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <MetricCard
            key={card.label}
            {...card}
            loading={loading}
            unavailable={unavailable}
            accent="teal"
          />
        ))}
      </div>
    </SectionShell>
  )
}
