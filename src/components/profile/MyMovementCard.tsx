import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, Heart, MoreVertical, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import MovementTypeBadge from '../MovementTypeBadge'
import type { Post } from '../../types'

const PREVIEW_LEN = 140

const categoryColors: Record<string, string> = {
  Education: 'bg-blue-50/90 text-blue-800 ring-blue-200/80',
  Environment: 'bg-emerald-50/90 text-emerald-800 ring-emerald-200/80',
  Health: 'bg-rose-50/90 text-rose-800 ring-rose-200/80',
  Justice: 'bg-purple-50/90 text-purple-800 ring-purple-200/80',
  Technology: 'bg-violet-50/90 text-violet-800 ring-violet-200/80',
  Community: 'bg-amber-50/90 text-amber-900 ring-amber-200/80',
  Economy: 'bg-orange-50/90 text-orange-900 ring-orange-200/80',
  Other: 'bg-muted/90 text-secondary ring-default',
}

interface MyMovementCardProps {
  post: Post
  onDelete: (post: Post) => void
}

export default function MyMovementCard({ post, onDelete }: MyMovementCardProps) {
  const { t } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const preview =
    post.description.length > PREVIEW_LEN
      ? `${post.description.slice(0, PREVIEW_LEN).trim()}…`
      : post.description

  const created = new Date(post.created_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const catClass = categoryColors[post.category] ?? categoryColors.Other

  useEffect(() => {
    if (!menuOpen) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  return (
    <article className="card-surface relative min-w-0 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <MovementTypeBadge movementType={post.movement_type} />
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${catClass}`}
          >
            {post.category}
          </span>
        </div>
        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="rounded-lg p-2 text-muted transition hover:bg-muted hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label={t('profile.movementActions')}
          >
            <MoreVertical className="h-5 w-5" />
          </button>
          {menuOpen && (
            <ul
              role="menu"
              className="theme-menu right-0 mt-1 min-w-[180px] py-1"
            >
              <li role="none">
                <Link
                  to={`/feed/${post.id}`}
                  role="menuitem"
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-medium text-secondary hover:bg-muted"
                  onClick={() => setMenuOpen(false)}
                >
                  <ExternalLink className="h-4 w-4 text-accent-600" aria-hidden />
                  {t('profile.viewMovement')}
                </Link>
              </li>
              <li role="none">
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50"
                  onClick={() => {
                    setMenuOpen(false)
                    onDelete(post)
                  }}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                  {t('profile.deleteMovement')}
                </button>
              </li>
            </ul>
          )}
        </div>
      </div>

      <h4 className="wrap-user-text mt-3 text-base font-bold text-primary sm:text-lg">{post.title}</h4>
      <p className="wrap-user-text mt-1 line-clamp-2 text-sm leading-relaxed text-secondary">{preview}</p>

      <footer className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-default pt-3 text-xs text-muted">
        <time dateTime={post.created_at}>{created}</time>
        <span className="font-medium text-secondary">
          {post.posting_identity === 'youth_voice'
            ? t('profile.postedAsYouthVoice')
            : t('profile.postedAsProfile')}
        </span>
        {(post.support_count ?? 0) > 0 && (
          <span className="inline-flex items-center gap-1 font-medium text-brand-700">
            <Heart className="h-3.5 w-3.5" aria-hidden />
            {post.support_count} {t('profile.engagements')}
          </span>
        )}
      </footer>
    </article>
  )
}
