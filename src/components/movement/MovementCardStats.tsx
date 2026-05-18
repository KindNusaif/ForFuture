import { useTranslation } from 'react-i18next'
import { isPollMovement } from '../../lib/movements'
import { isPetitionMovement } from '../../lib/petitions'
import { isReliefPost } from '../../lib/reliefHub'
import type { Post } from '../../types'

interface MovementCardStatsProps {
  post: Post
  className?: string
  /** Show primary metrics even when zero so the card footer feels complete. */
  showPrimary?: boolean
}

export default function MovementCardStats({
  post,
  className = '',
  showPrimary = false,
}: MovementCardStatsProps) {
  const { t } = useTranslation()
  const isPoll = isPollMovement(post.movement_type)
  const isPetition = isPetitionMovement(post.movement_type)
  const isRelief = isReliefPost(post)
  const supporters = post.support_count ?? 0
  const pollVotes = post.poll?.totalVotes ?? 0
  const followers = post.follower_count ?? 0
  const volunteerSlots = post.volunteer_slots

  const items: { label: string; value: string }[] = []

  if (isPoll) {
    if (pollVotes > 0 || showPrimary) {
      items.push({
        label: t('movement.statsVotes', { defaultValue: 'Votes' }),
        value: String(pollVotes),
      })
    }
  } else if (isPetition) {
    if (supporters > 0 || showPrimary) {
      items.push({
        label: t('movement.statsSignatures', { defaultValue: 'Signatures' }),
        value: String(supporters),
      })
    }
    if (post.petition_support_goal && post.petition_support_goal > 0) {
      items.push({
        label: t('movement.statsGoal', { defaultValue: 'Goal' }),
        value: String(post.petition_support_goal),
      })
    }
  } else if (isRelief) {
    if (supporters > 0 || showPrimary) {
      items.push({
        label: t('movement.statsOffers', { defaultValue: 'Responses' }),
        value: String(supporters),
      })
    }
  } else {
    if (supporters > 0 || showPrimary) {
      items.push({
        label: t('movement.statsSupporters', { defaultValue: 'Supporters' }),
        value: String(supporters),
      })
    }
    if (post.movement_type === 'volunteer_drive' && volunteerSlots != null && volunteerSlots > 0) {
      items.push({
        label: t('movement.statsVolunteers', { defaultValue: 'Slots' }),
        value: String(volunteerSlots),
      })
    }
  }

  if (followers > 0) {
    items.push({
      label: t('movement.statsTracking', { defaultValue: 'Tracking' }),
      value: String(followers),
    })
  }

  if (items.length === 0) return null

  return (
    <div
      className={`movement-card-stats movement-card-stats--compact ${className}`.trim()}
      aria-label={t('movement.statsLabel', { defaultValue: 'Movement engagement' })}
    >
      {items.map(({ label, value }) => (
        <div key={label} className="movement-card-stat-pill">
          <span className="movement-card-stat-pill-value">{value}</span>
          <span className="movement-card-stat-pill-label">{label}</span>
        </div>
      ))}
    </div>
  )
}
