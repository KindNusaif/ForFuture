import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth'

/** Shown in production when the Netlify/build env is missing Supabase keys. */
export default function DeployConfigBanner() {
  const { configured } = useAuth()
  const { t } = useTranslation()

  if (configured || !import.meta.env.PROD) return null

  return (
    <div className="alert-warning relative z-50 border-b border-default px-4 py-3 text-center text-sm" role="alert">
      <strong>{t('deploy.missingEnvTitle')}</strong> {t('deploy.missingEnvBody')}
    </div>
  )
}
