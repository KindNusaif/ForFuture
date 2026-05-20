import { useEffect, useRef, useState } from 'react'
import { Flag, Loader2, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAsyncAction } from '../../hooks/useAsyncAction'
import { useToast } from '../../hooks/useToast'
import Textarea from '../ui/Textarea'
import CommentAuthorAvatar from './CommentAuthorAvatar'
import DeleteCommentDialog from './DeleteCommentDialog'
import ReportCommentDialog from './ReportCommentDialog'
import {
  canEditComment,
  deleteComment,
  updateComment,
  type Comment,
} from '../../lib/comments'
import { formatError } from '../../lib/errors'
import GuestActionGuard from '../guest/GuestActionGuard'

interface CommentItemProps {
  comment: Comment
  currentUserId?: string
  onDeleted: (commentId: string) => void
  onUpdated: (comment: Comment) => void
}

export default function CommentItem({
  comment,
  currentUserId,
  onDeleted,
  onUpdated,
}: CommentItemProps) {
  const { t } = useTranslation()
  const toast = useToast()
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editBody, setEditBody] = useState(comment.body)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)

  const isOwner = Boolean(currentUserId && comment.user_id === currentUserId)
  const editable = canEditComment(comment, currentUserId)

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

  const [runDelete, deleting] = useAsyncAction(async () => {
    await deleteComment(comment.id)
    toast.success(t('comments.deleteSuccess', { defaultValue: 'Comment deleted.' }))
    setDeleteOpen(false)
    onDeleted(comment.id)
  })

  const [runSaveEdit, saving] = useAsyncAction(async () => {
    const updated = await updateComment(comment.id, editBody)
    setEditing(false)
    onUpdated(updated)
  })

  const timestamp = new Date(comment.created_at).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <li className="comment-item">
      <div className="flex gap-3">
        <CommentAuthorAvatar displayName={comment.author_display_name} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-semibold text-primary">{comment.author_display_name}</span>
            <time className="text-xs text-muted" dateTime={comment.created_at}>
              {timestamp}
            </time>
            {comment.updated_at !== comment.created_at && !editing && (
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted">
                {t('comments.edited', { defaultValue: 'Edited' })}
              </span>
            )}
          </div>

          {editing ? (
            <form
              className="mt-2 space-y-2"
              onSubmit={(e) => {
                e.preventDefault()
                void runSaveEdit().catch((err) => toast.error(formatError(err)))
              }}
            >
              <Textarea
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                rows={3}
                maxLength={1000}
                aria-label={t('comments.editLabel', { defaultValue: 'Edit comment' })}
              />
              <div className="flex flex-wrap gap-2">
                <button type="submit" disabled={saving || !editBody.trim()} className="btn-primary text-sm">
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    t('common.save', { defaultValue: 'Save' })
                  )}
                </button>
                <button
                  type="button"
                  className="btn-secondary text-sm"
                  disabled={saving}
                  onClick={() => {
                    setEditing(false)
                    setEditBody(comment.body)
                  }}
                >
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          ) : (
            <p className="wrap-user-text mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-secondary">
              {comment.body}
            </p>
          )}

          {!editing && (
            <div className="relative mt-2" ref={menuRef} data-no-card-nav>
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="comment-menu-trigger rounded-lg p-1.5 text-muted hover:bg-muted hover:text-primary"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                aria-label={t('comments.menuLabel', { defaultValue: 'Comment options' })}
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              {menuOpen && (
                <ul role="menu" className="theme-menu content-owner-menu right-0 z-20 mt-1 min-w-[10rem] py-1">
                  {isOwner && (
                    <>
                      {editable && (
                        <li role="none">
                          <button
                            type="button"
                            role="menuitem"
                            className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-medium text-secondary hover:bg-muted"
                            onClick={() => {
                              setMenuOpen(false)
                              setEditing(true)
                            }}
                          >
                            <Pencil className="h-4 w-4" aria-hidden />
                            {t('comments.edit', { defaultValue: 'Edit' })}
                          </button>
                        </li>
                      )}
                      <li role="none">
                        <button
                          type="button"
                          role="menuitem"
                          className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/40"
                          onClick={() => {
                            setMenuOpen(false)
                            setDeleteOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                          {t('comments.delete', { defaultValue: 'Delete' })}
                        </button>
                      </li>
                    </>
                  )}
                  {!isOwner && (
                    <li role="none">
                      <GuestActionGuard
                        variant="report"
                        onMemberAction={() => setReportOpen(true)}
                      >
                        {({ run }) => (
                          <button
                            type="button"
                            role="menuitem"
                            className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-medium text-secondary hover:bg-muted"
                            onClick={() => {
                              setMenuOpen(false)
                              run()
                            }}
                          >
                            <Flag className="h-4 w-4" aria-hidden />
                            {t('comments.report', { defaultValue: 'Report comment' })}
                          </button>
                        )}
                      </GuestActionGuard>
                    </li>
                  )}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      <DeleteCommentDialog
        open={deleteOpen}
        deleting={deleting}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => void runDelete().catch((err) => toast.error(formatError(err)))}
      />
      <ReportCommentDialog
        open={reportOpen}
        commentId={comment.id}
        onClose={() => setReportOpen(false)}
      />
    </li>
  )
}

