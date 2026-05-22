import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, BadgeCheck, HeartHandshake, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import GuestModeBanner from '../components/guidance/GuestModeBanner'
import PostFeed from '../components/PostFeed'
import ReliefTrustStrip from '../components/relief/ReliefTrustStrip'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import type { ReliefHubFilter } from '../lib/reliefHub'
import type { ReliefHubTab } from '../lib/reliefCampaignPublic'
import { canCreateFundraisingCampaign } from '../lib/reliefCampaignPublic'

const TABS: { id: ReliefHubTab; filter?: ReliefHubFilter }[] = [
  { id: 'all', filter: 'all' },
  { id: 'urgent', filter: 'all' },
  { id: 'monetary', filter: 'fundraising' },
  { id: 'supplies', filter: 'item_donation' },
  { id: 'verified_orgs', filter: 'all' },
]

interface ReliefHubProps {
  mode?: 'guest' | 'member'
}

export default function ReliefHub({ mode = 'member' }: ReliefHubProps) {
  const isGuest = mode === 'guest'
  const { t } = useTranslation()
  const { profile, user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const toast = useToast()

  const [activeTab, setActiveTab] = useState<ReliefHubTab>('all')
  const [search, setSearch] = useState('')
  const reliefSubtype = useMemo(() => {
    const tab = TABS.find((x) => x.id === activeTab)
    return tab?.filter ?? 'all'
  }, [activeTab])

  const verifyPath = isGuest ? '/signup' : '/verification'
  const canFundraise = canCreateFundraisingCampaign(profile)

  useEffect(() => {
    const navToast = (location.state as { toast?: { type: 'success' | 'error'; message: string } })?.toast
    if (!navToast) return
    if (navToast.type === 'success') toast.success(navToast.message)
    else toast.error(navToast.message)
    navigate(location.pathname, { replace: true, state: {} })
  }, [location.pathname, location.state, navigate, toast])

  const memberTabs = user
    ? ([...TABS, { id: 'my_campaigns' as ReliefHubTab, filter: 'all' as ReliefHubFilter }] as const)
    : TABS

  return (
    <div className="relief-hub-page">
      {isGuest ? (
        <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
          <GuestModeBanner />
        </div>
      ) : null}
      <section className="relief-hub-hero mx-auto max-w-6xl px-4 pt-8 sm:px-6 sm:pt-10">
        <p className="relief-hub-eyebrow">{t('reliefHub.heroEyebrow')}</p>
        <h1 className="relief-hub-title font-display">{t('relief.title')}</h1>
        <p className="relief-hub-subtitle">{t('relief.subtitle')}</p>
        <div className="relief-hub-hero-actions">
          <a href="#relief-campaigns" className="btn-primary inline-flex items-center gap-2">
            {t('reliefHub.exploreCampaigns')}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </a>
          <Link to={verifyPath} className="btn-secondary inline-flex items-center gap-2">
            <BadgeCheck className="h-4 w-4" aria-hidden />
            {t('reliefHub.applyVerification')}
          </Link>
        </div>
        {!isGuest && !canFundraise && (
          <p className="relief-hub-verify-hint">{t('reliefHub.fundraisingVerifyHint')}</p>
        )}
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <ReliefTrustStrip />
      </div>

      <section id="relief-campaigns" className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="relief-hub-toolbar">
          <div className="relief-hub-search-wrap">
            <Search className="relief-hub-search-icon" aria-hidden />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('reliefHub.searchPlaceholder')}
              className="relief-hub-search"
              aria-label={t('reliefHub.searchPlaceholder')}
            />
          </div>
        </div>

        <div className="relief-hub-tabs" role="tablist" aria-label={t('relief.filterLabel')}>
          {memberTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={activeTab === tab.id ? 'relief-hub-tab relief-hub-tab--active' : 'relief-hub-tab'}
            >
              {t(`reliefHub.tabs.${tab.id}`)}
            </button>
          ))}
        </div>

        <PostFeed
          mode={isGuest ? 'guest' : 'member'}
          userId={user?.id}
          reliefHub
          reliefSubtype={reliefSubtype}
          reliefHubTab={activeTab}
          reliefSearchQuery={search}
          reliefDetailBase={isGuest ? '/explore/relief' : '/relief'}
          showCreateButton={false}
          className="mt-6"
        />

        {!isGuest && (
          <div className="relief-hub-create-bar card-surface mt-10 flex flex-wrap items-center justify-between gap-4 p-6">
            <div className="flex items-start gap-3">
              <HeartHandshake className="h-8 w-8 shrink-0 text-rose-600" aria-hidden />
              <div>
                <p className="font-semibold text-primary">{t('relief.createTitle')}</p>
                <p className="mt-1 text-sm text-secondary">{t('reliefHub.createBarHint')}</p>
              </div>
            </div>
            <Link to="/relief/create" className="btn-primary shrink-0">
              {t('relief.createCta')}
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}
