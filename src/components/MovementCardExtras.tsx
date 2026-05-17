import type { ReactNode } from 'react'
import { Calendar, Clock, MapPin, Users } from 'lucide-react'
import MapPreview from './MapPreview'
import { formatCurrency, formatEventDate } from '../lib/movements'
import {
  formatPetitionSupporterCount,
  getPetitionClosingLabel,
  getPetitionProgressPercent,
  isPetitionClosed,
  PETITION_DISCLAIMER,
} from '../lib/petitions'
import { getMovementVisual } from '../lib/movementVisual'
import { isReliefPost } from '../lib/reliefHub'
import ReliefHubExtras from './relief/ReliefHubExtras'
import {
  shouldShowCampaignReview,
  shouldShowFundraisingNotReviewedMessage,
  TRUST_TOOLTIPS,
} from '../lib/trust'
import type { Post } from '../types'
import CampaignReviewBadge from './CampaignReviewBadge'

interface MovementCardExtrasProps {
  post: Post
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="wrap-user-text min-w-0">
      <dt className="text-[10px] font-bold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm leading-relaxed text-secondary">{value}</dd>
    </div>
  )
}

function EventMetaRow({
  icon: Icon,
  children,
}: {
  icon: typeof Calendar
  children: ReactNode
}) {
  return (
    <li className="wrap-user-text flex min-w-0 items-start gap-2 text-sm text-secondary">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 opacity-80" aria-hidden />
      <span>{children}</span>
    </li>
  )
}

export default function MovementCardExtras({ post }: MovementCardExtrasProps) {
  if (isReliefPost(post)) {
    return <ReliefHubExtras post={post} />
  }

  const panel = getMovementVisual(post.movement_type).sectionPanel

  switch (post.movement_type) {
    case 'idea_for_change':
      if (!post.proposed_solution && !post.expected_impact) return null
      return (
        <dl className={`mt-4 space-y-3 rounded-xl border p-4 ${panel}`}>
          {post.proposed_solution && (
            <Detail label="Proposed solution" value={post.proposed_solution} />
          )}
          {post.expected_impact && <Detail label="Expected impact" value={post.expected_impact} />}
        </dl>
      )

    case 'raise_voice':
      if (!post.issue_summary && !post.desired_change) return null
      return (
        <dl className={`mt-4 space-y-3 rounded-xl border p-4 ${panel}`}>
          {post.issue_summary && <Detail label="Issue" value={post.issue_summary} />}
          {post.desired_change && <Detail label="Desired change" value={post.desired_change} />}
        </dl>
      )

    case 'volunteer_drive': {
      const date = formatEventDate(post.event_date)
      const hasMeta = date || post.event_time || post.location || post.volunteer_slots
      if (!hasMeta && !post.contact_note) return null
      return (
        <div className={`mt-4 overflow-hidden rounded-xl border ${panel}`}>
          <div className="border-b border-inherit bg-surface/50 px-4 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wide text-teal-800">
              Volunteer event
            </p>
          </div>
          <div className="space-y-3 p-4">
            {hasMeta && (
              <ul className="space-y-2">
                {date && (
                  <EventMetaRow icon={Calendar}>
                    {date}
                    {post.event_time ? (
                      <>
                        {' '}
                        <span className="text-muted">·</span> {post.event_time}
                      </>
                    ) : null}
                  </EventMetaRow>
                )}
                {post.event_time && !date && (
                  <EventMetaRow icon={Clock}>{post.event_time}</EventMetaRow>
                )}
                {post.location && (
                  <EventMetaRow icon={MapPin}>{post.location}</EventMetaRow>
                )}
                {post.volunteer_slots != null && post.volunteer_slots > 0 && (
                  <EventMetaRow icon={Users}>
                    {post.volunteer_slots} slot{post.volunteer_slots === 1 ? '' : 's'} available
                  </EventMetaRow>
                )}
              </ul>
            )}
            {post.contact_note && (
              <p className="wrap-user-text rounded-lg bg-surface/70 px-3 py-2 text-xs leading-relaxed text-secondary ring-1 ring-default/60">
                {post.contact_note}
              </p>
            )}
            <MapPreview post={post} />
          </div>
        </div>
      )
    }

    case 'fundraising': {
      const goal = post.fundraising_goal_amount ?? 0
      const raised = post.current_raised_amount ?? 0
      const pct = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0
      const reviewed = shouldShowCampaignReview(post)
      const showNotReviewed = shouldShowFundraisingNotReviewedMessage(post)
      return (
        <div className={`mt-4 rounded-xl border p-4 ${panel}`}>
          {reviewed ? (
            <div className="mb-3">
              <CampaignReviewBadge
                movementType="fundraising"
                reviewedCampaignType={
                  post.reviewed_campaign_type ?? post.trusted_campaign_type
                }
                prominent
              />
            </div>
          ) : showNotReviewed ? (
            <p className="mb-3 text-xs text-muted">{TRUST_TOOLTIPS.fundraisingNotReviewed}</p>
          ) : null}
          {post.fundraising_purpose && (
            <p className="wrap-user-text text-sm font-semibold text-primary">
              {post.fundraising_purpose}
            </p>
          )}
          {post.beneficiary_description && (
            <p className="wrap-user-text mt-1.5 text-xs leading-relaxed text-secondary">
              {post.beneficiary_description}
            </p>
          )}
          {goal > 0 && (
            <div className="mt-3">
              <div className="flex justify-between text-xs font-semibold text-secondary">
                <span>{formatCurrency(raised)} raised</span>
                <span>Goal {formatCurrency(goal)}</span>
              </div>
              <div
                className="mt-2 h-2 overflow-hidden rounded-full bg-sky-200/60"
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full bg-linear-to-r from-sky-500 to-accent-500 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-muted">
                Support intent only — payments are not live on ForFuture yet.
              </p>
            </div>
          )}
        </div>
      )
    }

    case 'youth_petition': {
      const issue = post.petition_issue
      const change = post.petition_requested_change
      const target = post.petition_target_authority
      if (!issue && !change && !target) return null

      const count = post.support_count ?? 0
      const goal = post.petition_support_goal
      const progress = getPetitionProgressPercent(count, goal)
      const closed = isPetitionClosed(post)
      const closingLabel = getPetitionClosingLabel(post.petition_closing_date)
      const reviewed = shouldShowCampaignReview(post)

      return (
        <div className={`mt-4 space-y-3 rounded-xl border p-4 ${panel}`}>
          {reviewed && (
            <CampaignReviewBadge
              movementType="youth_petition"
              reviewedCampaignType={
                post.reviewed_campaign_type ?? post.trusted_campaign_type
              }
            />
          )}
          {closingLabel && (
            <p
              className={`text-xs font-semibold ${closed ? 'text-muted' : 'text-fuchsia-800'}`}
            >
              {closed ? 'Closed' : closingLabel}
            </p>
          )}
          {issue && <Detail label="Issue" value={issue} />}
          {change && <Detail label="Requested change" value={change} />}
          {target && <Detail label="Addressed to" value={target} />}
          {post.petition_impact_note && (
            <Detail label="Why this matters" value={post.petition_impact_note} />
          )}
          {goal != null && goal > 0 && (
            <div>
              <p className="text-xs font-semibold text-secondary">
                {formatPetitionSupporterCount(count, goal)}
              </p>
              <div
                className="mt-2 h-2 overflow-hidden rounded-full bg-fuchsia-200/60"
                role="progressbar"
                aria-valuenow={progress ?? 0}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full bg-linear-to-r from-fuchsia-500 to-accent-500"
                  style={{ width: `${progress ?? 0}%` }}
                />
              </div>
            </div>
          )}
          <p className="text-[11px] leading-relaxed text-muted">{PETITION_DISCLAIMER}</p>
        </div>
      )
    }

    case 'peaceful_civic_action': {
      const date = formatEventDate(post.action_date)
      if (!post.action_purpose && !date && !post.action_time && !post.action_location && !post.safety_note) {
        return null
      }
      return (
        <div className={`mt-4 space-y-3 rounded-xl border p-4 ${panel}`}>
          <p className="text-[10px] font-bold uppercase tracking-wide text-orange-800">
            Civic action details
          </p>
          {post.action_purpose && (
            <p className="wrap-user-text text-sm font-semibold leading-relaxed text-primary">
              {post.action_purpose}
            </p>
          )}
          {(date || post.action_time || post.action_location) && (
            <ul className="space-y-2">
              {date && (
                <EventMetaRow icon={Calendar}>
                  {date}
                  {post.action_time ? ` · ${post.action_time}` : ''}
                </EventMetaRow>
              )}
              {post.action_location && (
                <EventMetaRow icon={MapPin}>{post.action_location}</EventMetaRow>
              )}
            </ul>
          )}
          {post.safety_note && (
            <p className="wrap-user-text rounded-lg bg-surface/60 px-3 py-2 text-xs text-orange-900/90 ring-1 ring-orange-200/50">
              {post.safety_note}
            </p>
          )}
          <MapPreview post={post} />
        </div>
      )
    }

    default:
      return null
  }
}
