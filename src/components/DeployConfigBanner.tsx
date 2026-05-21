import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth'
import { isSupabaseClientReady, isSupabaseConfigured } from '../lib/supabase'

/** Shown in production when the Netlify/build env is missing or invalid Supabase keys. */
export default function DeployConfigBanner() {
  const { configured } = useAuth()
  const { t } = useTranslation()

  const misconfigured = isSupabaseConfigured && !isSupabaseClientReady()

  if ((configured && !misconfigured) || !import.meta.env.PROD) return null

  return (
    <div className="alert-warning relative z-50 border-b border-default px-4 py-3 text-center text-sm" role="alert">
      <strong>{t('deploy.missingEnvTitle')}</strong>{' '}
      {misconfigured
        ? t('deploy.invalidEnvBody', {
            defaultValue:
              'Supabase environment variables are set but invalid. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Netlify, then redeploy.',
          })
        : t('deploy.missingEnvBody')}
    </div>
  )
}
