import { Flag } from 'lucide-react'
import { useAuthUser } from '../hooks/useAuthUser'
import { useJoinMovement } from '../hooks/useJoinMovement'
import { useReportContent } from '../hooks/useReportContent'
import { getReportableContentTypeForPost } from '../lib/moderation'
import type { Post } from '../types'

interface ReportContentButtonProps {
  post: Post
  className?: string
}

export default function ReportContentButton({ post, className = '' }: ReportContentButtonProps) {
  const { isMember } = useAuthUser()
  const { openJoinModal } = useJoinMovement()
  const { openReportModal } = useReportContent()

  function handleClick() {
    if (!isMember) {
      openJoinModal('report')
      return
    }

    openReportModal({
      contentType: getReportableContentTypeForPost(post),
      contentId: post.id,
      contentLabel: post.title?.trim() || post.description?.slice(0, 80) || 'Community content',
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex min-h-[32px] items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500 ${className}`}
      aria-label="Report this content"
    >
      <Flag className="h-3.5 w-3.5" aria-hidden />
      Report
    </button>
  )
}
