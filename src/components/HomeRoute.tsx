import { lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import LandingPageShell from './auth/LandingPageShell'
import { useAuth } from '../hooks/useAuth'
import { usePageMeta } from '../hooks/usePageMeta'

const LandingLovable = lazy(() => import('../pages/LandingLovable'))

function LandingWithMeta() {
  const { t } = useTranslation()

  usePageMeta({
    title: t('landing.metaTitle', { defaultValue: 'ForFuture — Youth civic action' }),
    description: t('landing.metaDescription', {
      defaultValue:
        'Create and support youth-led movements, petitions, polls, and volunteer drives in your community.',
    }),
    path: '/',
  })

  return <LandingLovable />
}

/** Marketing home at `/` — waits for auth before showing member CTAs. */
export default function HomeRoute() {
  const { authReady, loggingOut } = useAuth()

  if (!authReady || loggingOut) {
    return <LandingPageShell />
  }

  return (
    <Suspense fallback={<LandingPageShell />}>
      <LandingWithMeta />
    </Suspense>
  )
}
