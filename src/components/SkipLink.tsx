import { useTranslation } from 'react-i18next'

export default function SkipLink({ targetId = 'main-content' }: { targetId?: string }) {
  const { t } = useTranslation()

  return (
    <a href={`#${targetId}`} className="skip-link">
      {t('a11y.skipToMain', { defaultValue: 'Skip to main content' })}
    </a>
  )
}
