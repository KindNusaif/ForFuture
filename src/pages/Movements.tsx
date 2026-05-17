import { List } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PostFeed from '../components/PostFeed'
import { useAuthUser } from '../hooks/useAuthUser'

export default function Movements() {
  const { t } = useTranslation()
  const { isMember, loading } = useAuthUser()

  if (!loading && isMember) {
    return <Navigate to="/feed" replace />
  }

  return (
    <div className="mx-auto min-w-0 max-w-3xl px-4 py-8 sm:px-6 lg:max-w-4xl lg:py-10">
      <header className="mb-6 border-b border-default pb-6">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent-50 text-accent-700 ring-1 ring-accent-200/80">
            <List className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h1 className="page-title text-2xl sm:text-3xl">{t('movementsPage.title')}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-secondary sm:text-base">
              {t('movementsPage.subtitle')}
            </p>
          </div>
        </div>
      </header>

      <PostFeed mode="guest" showCreateButton={false} />
    </div>
  )
}
