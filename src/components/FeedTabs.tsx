import { useCallback, useRef } from 'react'
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
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  const tabs: { id: FeedTab; label: string; badge?: number }[] = [
    { id: 'discover', label: t('feed.tabDiscover') },
    {
      id: 'following',
      label: t('feed.tabFollowing'),
      badge: followingCount && followingCount > 0 ? followingCount : undefined,
    },
  ]

  const focusTab = useCallback((index: number) => {
    const el = tabRefs.current[index]
    el?.focus()
    el?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
  }, [])

  function handleKeyDown(e: React.KeyboardEvent, index: number) {
    const last = tabs.length - 1
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      const next = index >= last ? 0 : index + 1
      onChange(tabs[next].id)
      focusTab(next)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      const prev = index <= 0 ? last : index - 1
      onChange(tabs[prev].id)
      focusTab(prev)
    } else if (e.key === 'Home') {
      e.preventDefault()
      onChange(tabs[0].id)
      focusTab(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      onChange(tabs[last].id)
      focusTab(last)
    }
  }

  return (
    <div
      className={`feed-tabs ${className}`}
      role="tablist"
      aria-label={t('feed.tabsLabel', { defaultValue: 'Feed views' })}
    >
      {tabs.map((tab, index) => {
        const selected = active === tab.id
        return (
          <button
            key={tab.id}
            ref={(el) => {
              tabRefs.current[index] = el
            }}
            type="button"
            role="tab"
            id={`feed-tab-${tab.id}`}
            aria-selected={selected}
            aria-controls={`feed-panel-${tab.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={selected ? 'feed-tab feed-tab-active' : 'feed-tab'}
          >
            {tab.label}
            {tab.badge != null && <span className="feed-tab-badge">{tab.badge}</span>}
          </button>
        )
      })}
    </div>
  )
}
