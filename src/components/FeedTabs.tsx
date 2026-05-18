import { useTranslation } from 'react-i18next'

export type FeedTab = 'discover' | 'following'

interface FeedTabsProps {
  active: FeedTab
  onChange: (tab: FeedTab) => void
  followingCount?: number
  className?: string
}

export default function FeedTabs({
  active,
  onChange,
  followingCount,
  className = '',
}: FeedTabsProps) {
  const { t } = useTranslation()

  const tabs: { id: FeedTab; label: string; badge?: number }[] = [
    { id: 'discover', label: t('feed.tabDiscover') },
    {
      id: 'following',
      label: t('feed.tabFollowing'),
      badge: followingCount && followingCount > 0 ? followingCount : undefined,
    },
  ]

  return (
    <div
      className={`flex flex-wrap gap-2 ${className}`}
      role="tablist"
      aria-label={t('feed.tabsLabel', { defaultValue: 'Feed views' })}
    >
      {tabs.map((tab) => {
        const selected = active === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={
              selected
                ? 'rounded-full bg-accent-600 px-4 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-accent-500/30 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500 dark:bg-accent-600'
                : 'rounded-full border border-default bg-surface px-4 py-2 text-sm font-semibold text-secondary transition hover:border-accent-300/60 hover:bg-muted hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500'
            }
          >
            {tab.label}
            {tab.badge != null && (
              <span
                className={`ml-1.5 inline-flex min-w-[1.25rem] justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  selected ? 'bg-white/20 text-white' : 'bg-muted text-muted'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
