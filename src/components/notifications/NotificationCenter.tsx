import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, Loader2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import { useNotifications } from '../../hooks/useNotifications'
import { notificationHref } from '../../lib/notifications'

function formatWhen(iso: string): string {
  try {
    const d = new Date(iso)
    const diff = Date.now() - d.getTime()
    if (diff < 60_000) return 'Just now'
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
    return d.toLocaleDateString()
  } catch {
    return ''
  }
}

export default function NotificationCenter() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const { items, loading, error, unreadCount, reload, markRead, markAllRead } =
    useNotifications(user?.id)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        setMobileOpen(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const badge =
    unreadCount > 0 ? (unreadCount > 9 ? '9+' : String(unreadCount)) : null

  function handleOpen() {
    const desktop = window.matchMedia('(min-width: 1024px)').matches
    if (desktop) {
      setOpen((o) => !o)
      setMobileOpen(false)
    } else {
      setMobileOpen((o) => !o)
      setOpen(false)
    }
  }

  async function handleItemClick(id: string, href: string | null) {
    await markRead(id)
    setOpen(false)
    setMobileOpen(false)
    if (href) navigate(href)
  }

  const panel = (
    <div className="notification-panel">
      <div className="flex items-center justify-between gap-2 border-b border-default px-4 py-3">
        <h2 className="text-sm font-bold text-primary">
          {t('notifications.title', { defaultValue: 'Notifications' })}
        </h2>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => void markAllRead()}
              className="btn-ghost min-h-8! px-2! text-xs"
              aria-label={t('notifications.markAllRead', { defaultValue: 'Mark all as read' })}
            >
              <CheckCheck className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Mark all</span>
            </button>
          )}
          <button
            type="button"
            className="btn-ghost min-h-8! w-8! p-0! lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close notifications"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="max-h-[min(24rem,60vh)] overflow-y-auto">
        {loading && items.length === 0 && (
          <p className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-muted">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Loading…
          </p>
        )}
        {error && (
          <p className="px-4 py-6 text-center text-sm text-red-600" role="alert">
            {error}
            <button type="button" onClick={() => void reload()} className="btn-secondary mt-3 w-full">
              Retry
            </button>
          </p>
        )}
        {!loading && !error && items.length === 0 && (
          <p className="px-4 py-10 text-center text-sm leading-relaxed text-secondary">
            {t('notifications.empty', {
              defaultValue:
                "You're all caught up. Follow movements to receive updates here.",
            })}
          </p>
        )}
        <ul className="divide-y divide-default">
          {items.map((n) => {
            const href = notificationHref(n, 'member')
            return (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => void handleItemClick(n.id, href)}
                  className={`notification-item w-full text-left ${n.is_read ? 'notification-item-read' : 'notification-item-unread'}`}
                >
                  <p className="text-sm font-semibold text-primary">{n.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-secondary">{n.message}</p>
                  <p className="mt-1 text-[10px] font-medium text-muted">{formatWhen(n.created_at)}</p>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={handleOpen}
        className="btn-ghost relative min-h-10! w-10! p-0!"
        aria-label={t('notifications.open', { defaultValue: 'Open notifications' })}
        aria-expanded={open || mobileOpen}
      >
        <Bell className="h-5 w-5" aria-hidden />
        {badge && (
          <span className="notification-badge" aria-hidden>
            {badge}
          </span>
        )}
      </button>

      {open && (
        <div className="notification-dropdown hidden lg:block" role="dialog" aria-label="Notifications">
          {panel}
        </div>
      )}

      {mobileOpen && (
        <div
          className="notification-sheet lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Notifications"
        >
          <button
            type="button"
            className="notification-sheet-backdrop"
            aria-label="Close"
            onClick={() => setMobileOpen(false)}
          />
          {panel}
        </div>
      )}
    </div>
  )
}
