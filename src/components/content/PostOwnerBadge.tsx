import { Shield } from 'lucide-react'
import { useTranslation } from 'react-i18next'

/** Owner-only label for anonymous Youth Voice posts — never shown to other users. */
export default function PostOwnerBadge() {
  const { t } = useTranslation()

  return (
    <span
      className="owner-anonymous-badge inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide ring-1"
      title={t('contentOwner.anonymousOwnerHint')}
    >
      <Shield className="h-3 w-3 shrink-0 opacity-80" aria-hidden />
      <span className="truncate">{t('contentOwner.anonymousOwnerBadge')}</span>
    </span>
  )
}
