import { BadgeCheck, Flag, HeartHandshake, Share2, Wallet } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import HelpTooltip from '../guidance/HelpTooltip'

export default function ReliefTrustStrip() {
  const { t } = useTranslation()

  const points = [
    { icon: BadgeCheck, label: t('reliefHub.trustPointVerified') },
    { icon: Wallet, label: t('reliefHub.trustPointTransparent') },
    { icon: Flag, label: t('reliefHub.trustPointModeration') },
    { icon: Share2, label: t('reliefHub.trustPointBeyondMoney') },
  ] as const

  return (
    <section className="relief-trust-strip" aria-labelledby="relief-trust-heading">
      <p id="relief-trust-heading" className="relief-trust-strip-lead flex flex-wrap items-center gap-2">
        <HeartHandshake className="inline h-4 w-4 shrink-0 text-mint" aria-hidden />
        <span className="flex-1">{t('reliefHub.trustStripLead')}</span>
        <HelpTooltip
          label={t('guidance.tooltips.trustedCampaignLabel')}
          text={t('guidance.tooltips.trustedCampaign')}
        />
      </p>
      <ul className="relief-trust-strip-grid">
        {points.map(({ icon: Icon, label }) => (
          <li key={label} className="relief-trust-strip-item">
            <span className="relief-trust-strip-icon" aria-hidden>
              <Icon className="h-4 w-4" />
            </span>
            <span>{label}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
