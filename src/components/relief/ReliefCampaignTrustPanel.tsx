import { BadgeCheck, FileCheck, Flag, LineChart } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function ReliefCampaignTrustPanel() {
  const { t } = useTranslation()

  const items = [
    { icon: BadgeCheck, text: t('reliefHub.trustPanelItem1') },
    { icon: FileCheck, text: t('reliefHub.trustPanelItem2') },
    { icon: Flag, text: t('reliefHub.trustPanelItem3') },
    { icon: LineChart, text: t('reliefHub.trustPanelItem4') },
  ] as const

  return (
    <aside className="relief-trust-panel card-surface p-6">
      <h2 className="text-lg font-bold text-primary">{t('reliefHub.trustPanelTitle')}</h2>
      <ul className="mt-4 space-y-3">
        {items.map(({ icon: Icon, text }) => (
          <li key={text} className="flex gap-3 text-sm leading-relaxed text-secondary">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-mint" aria-hidden />
            <span>{text}</span>
          </li>
        ))}
      </ul>
    </aside>
  )
}
