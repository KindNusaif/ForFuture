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
      <div className="overflow-hidden rounded-3xl border border-brand-200/80 bg-linear-to-br from-brand-50/90 via-white to-accent-50/50 shadow-sm">
        <div className="flex items-start gap-4 border-b border-brand-100/80 px-5 py-5 sm:px-6">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
            <ShieldCheck className="h-6 w-6" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-brand-900">{t('impactPulse.trust.panelTitle')}</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">{t('impactPulse.trust.note')}</p>
          </div>
        </div>

        <ul className="grid gap-px bg-brand-100/60 sm:grid-cols-2 lg:grid-cols-3">
          {TRUST_ITEMS.map(({ key, field, icon: Icon }) => (
            <li key={key} className="bg-white/90 px-5 py-4 sm:px-6">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-700">
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                {t(`impactPulse.trust.${key}`)}
              </div>
              {loading ? (
                <Skeleton className="mt-2 h-8 w-16 rounded-lg" />
              ) : unavailable ? (
                <p className="mt-2 text-2xl font-extrabold text-slate-400">—</p>
              ) : (
                <p className="mt-2 text-2xl font-extrabold tabular-nums text-slate-900">
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
