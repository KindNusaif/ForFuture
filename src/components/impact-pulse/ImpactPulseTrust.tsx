import { BadgeCheck, Eye, Megaphone, Shield, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ImpactPulseTrust as TrustData } from '../../lib/impactPulse'
import MetricCard from './MetricCard'
import SectionShell from './SectionShell'

interface Props {
  trust: TrustData
  loading?: boolean
}

export default function ImpactPulseTrust({ trust, loading }: Props) {
  const { t } = useTranslation()

  const cards = [
    { icon: BadgeCheck, label: t('impactPulse.trust.verified'), value: trust.verified_organizers },
    { icon: ShieldCheck, label: t('impactPulse.trust.reviewed'), value: trust.reviewed_campaigns },
    { icon: Shield, label: t('impactPulse.trust.fundraising'), value: trust.trusted_fundraising },
    { icon: Eye, label: t('impactPulse.trust.reports'), value: trust.reports_processed },
    { icon: Megaphone, label: t('impactPulse.trust.youthVoice'), value: trust.youth_voice_posts },
  ]

  return (
    <SectionShell
      id="trust-safety"
      title={t('impactPulse.trust.title')}
      subtitle={t('impactPulse.trust.subtitle')}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <MetricCard key={card.label} {...card} loading={loading} accent="brand" />
        ))}
      </div>
      <p className="mt-6 max-w-3xl text-sm leading-relaxed text-slate-600">
        {t('impactPulse.trust.note')}
      </p>
    </SectionShell>
  )
}
