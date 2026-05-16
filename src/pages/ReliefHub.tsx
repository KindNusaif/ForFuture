import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { HeartHandshake, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import PostFeed from '../components/PostFeed'
import Toast from '../components/Toast'
import type { ReliefHubFilter } from '../lib/reliefHub'

const SUBFILTERS: ReliefHubFilter[] = ['all', 'blood_donation', 'item_donation', 'fundraising']

interface ReliefHubProps {
  mode?: 'guest' | 'member'
}

export default function ReliefHub({ mode = 'member' }: ReliefHubProps) {
  const isGuest = mode === 'guest'
  const { t } = useTranslation()
  const location = useLocation()
  const toast = (location.state as { toast?: { type: 'success' | 'error'; message: string } })
    ?.toast
  const [reliefSubtype, setReliefSubtype] = useState<ReliefHubFilter>('all')
  const [dismissToast, setDismissToast] = useState(false)

  return (
    <section className="mx-auto min-w-0 max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      {toast && !dismissToast && (
        <div className="mb-4">
          <Toast
            variant={toast.type}
            message={toast.message}
            onDismiss={() => setDismissToast(true)}
          />
        </div>
      )}

      <header className="card-surface overflow-hidden border border-rose-200/60 bg-linear-to-br from-rose-50/80 via-white to-sky-50/50 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-rose-700">
              <HeartHandshake className="h-4 w-4" aria-hidden />
              {t('relief.eyebrow')}
            </p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              {t('relief.title')}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600">
              {t('relief.subtitle')}
            </p>
          </div>
          <Link
        to={isGuest ? '/signup' : '/relief/create'}
        className="btn-primary shrink-0"
      >
            <Plus className="h-4 w-4" aria-hidden />
            {t('relief.createCta')}
          </Link>
        </div>
      </header>

      <div className="mt-6 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {t('relief.filterLabel')}
        </p>
        <div className="-mx-1 flex gap-2 overflow-x-auto pb-1">
          {SUBFILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setReliefSubtype(f)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                reliefSubtype === f ? 'pill-active' : 'pill-inactive'
              }`}
            >
              {t(`relief.filters.${f}`)}
            </button>
          ))}
        </div>
      </div>

      <PostFeed
        mode={isGuest ? 'guest' : 'member'}
        reliefHub
        reliefSubtype={reliefSubtype}
        showCreateButton={false}
        className="mt-6"
      />
    </section>
  )
}
