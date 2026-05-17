import { BadgeCheck, Eye, Megaphone, Shield, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ImpactPulseTrust as TrustData } from '../../lib/impactPulse'
import { formatImpactCountFull } from '../../lib/impactPulse'
import SectionShell from './SectionShell'
import { Skeleton } from '../Skeleton'

interface Props {
  trust: TrustData
  loading?: boolean
  unavailable?: boolean
}

const TRUST_ITEMS = [
  { key: 'verified', field: 'verified_organizers' as const, icon: BadgeCheck },
  { key: 'reviewed', field: 'reviewed_campaigns' as const, icon: ShieldCheck },
  { key: 'fundraising', field: 'trusted_fundraising' as const, icon: Shield },
  { key: 'reports', field: 'reports_processed' as const, icon: Eye },
  { key: 'youthVoice', field: 'youth_voice_posts' as const, icon: Megaphone },
] as const

export default function ImpactPulseTrust({ trust, loading, unavailable }: Props) {
  const { t } = useTranslation()

  return (
    <SectionShell
      id="trust-safety"
      title={t('impactPulse.trust.title')}
      subtitle={t('impactPulse.trust.subtitle')}
    >
      <div className="trust-panel">
        <div className="flex items-start gap-4 border-b border-default px-5 py-5 sm:px-6">
          <span className="metric-icon-brand flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl">
            <ShieldCheck className="h-6 w-6" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-primary">{t('impactPulse.trust.panelTitle')}</p>
            <p className="mt-1 text-sm leading-relaxed text-secondary">{t('impactPulse.trust.note')}</p>
          </div>
        </div>

        <ul className="trust-panel-grid sm:grid-cols-2 lg:grid-cols-3">
          {TRUST_ITEMS.map(({ key, field, icon: Icon }) => (
            <li key={key} className="trust-panel-cell px-5 py-4 sm:px-6">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-700">
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                {t(`impactPulse.trust.${key}`)}
              </div>
              {loading ? (
                <Skeleton className="mt-2 h-8 w-16 rounded-lg" />
              ) : unavailable ? (
                <p className="mt-2 text-2xl font-extrabold text-muted">—</p>
              ) : (
                <p className="mt-2 text-2xl font-extrabold tabular-nums stat-value">
                  {formatImpactCountFull(trust[field])}
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </SectionShell>
  )
}
