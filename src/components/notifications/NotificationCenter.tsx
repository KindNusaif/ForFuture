import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, Inbox, Loader2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import { useNotifications } from '../../hooks/useNotifications'
import { notificationHref } from '../../lib/notifications'

const DROPDOWN_WIDTH_PX = 352
const DROPDOWN_GAP_PX = 8
const VIEWPORT_PAD_PX = 8

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
  const dropdownRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [dropdownStyle, setDropdownStyle] = useState<CSSProperties | null>(null)
  const { items, loading, error, unreadCount, reload, markRead, markAllRead } =
    useNotifications(user?.id)

  useLayoutEffect(() => {
    if (!open) {
      setDropdownStyle(null)
      return
    }

    function updatePosition() {
      const trigger = triggerRef.current
      if (!trigger) return
      const rect = trigger.getBoundingClientRect()
      const width = Math.min(DROPDOWN_WIDTH_PX, window.innerWidth - VIEWPORT_PAD_PX * 2)
      let left = rect.right - width
      left = Math.max(
        VIEWPORT_PAD_PX,
        Math.min(left, window.innerWidth - width - VIEWPORT_PAD_PX),
      )
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + DROPDOWN_GAP_PX,
        left,
        width,
        zIndex: 9999,
      })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open])

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      const target = e.target as Node
      if (rootRef.current?.contains(target)) return
      if (dropdownRef.current?.contains(target)) return
      setOpen(false)
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
          <p className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-muted">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            {t('notifications.loading', { defaultValue: 'Loading notifications…' })}
          </p>
        )}
        {error && (
          <div
            className="px-4 py-8 text-center"
            role="alert"
            aria-live="polite"
          >
            <p className="text-sm font-medium text-primary">
              {t('notifications.errorTitle', {
                defaultValue: "We couldn't load notifications",
              })}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-secondary">
              {t('notifications.errorDescription', {
                defaultValue: 'Check your connection and try again.',
              })}
            </p>
            <button
              type="button"
              onClick={() => void reload()}
              className="btn-secondary mt-4 min-h-11 w-full sm:w-auto"
            >
              {t('notifications.retry', { defaultValue: 'Try again' })}
            </button>
          </div>
        )}
        {!loading && !error && items.length === 0 && (
          <div className="flex flex-col items-center px-6 py-10 text-center">
            <span className="inline-flex rounded-2xl bg-muted p-3 text-muted" aria-hidden>
              <Inbox className="h-6 w-6" />
            </span>
            <p className="mt-4 text-sm font-semibold text-primary">
              {t('notifications.emptyTitle', { defaultValue: "You're all caught up" })}
            </p>
            <p className="mt-1 max-w-xs text-xs leading-relaxed text-secondary">
              {t('notifications.empty', {
                defaultValue:
                  'Follow movements to receive updates when something new happens.',
              })}
            </p>
          </div>
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
        ref={triggerRef}
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

      {open &&
        dropdownStyle &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={dropdownRef}
            className="notification-dropdown notification-dropdown-portal hidden lg:block"
            style={dropdownStyle}
            role="dialog"
            aria-label="Notifications"
          >
            {panel}
          </div>,
          document.body,
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
