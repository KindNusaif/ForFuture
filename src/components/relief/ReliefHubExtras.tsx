import { Calendar, Droplet, MapPin, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import MapPreview from '../MapPreview'
import CampaignReviewBadge from '../CampaignReviewBadge'
import { formatCurrency, formatEventDate } from '../../lib/movements'
import { getMovementVisual } from '../../lib/movementVisual'
import {
  formatPledgeProgress,
  getReliefDisplaySubtype,
  urgencyBadgeClass,
} from '../../lib/reliefHub'
import {
  shouldShowCampaignReview,
  shouldShowFundraisingNotReviewedMessage,
  TRUST_TOOLTIPS,
} from '../../lib/trust'
import type { Post } from '../../types'

interface ReliefHubExtrasProps {
  post: Post
}

export default function ReliefHubExtras({ post }: ReliefHubExtrasProps) {
  const { t } = useTranslation()
  const subtype = getReliefDisplaySubtype(post)
  if (!subtype) return null

  const panel = getMovementVisual(
    post.movement_type === 'fundraising' ? 'fundraising' : 'donation_relief',
  ).sectionPanel
  const reviewed = shouldShowCampaignReview(post)

  if (subtype === 'blood_donation') {
    const location = post.location ?? post.location_name
    return (
      <div className={`mt-4 space-y-3 rounded-xl border p-4 ${panel}`}>
        <div className="flex flex-wrap items-center gap-2">
          {post.urgency_level && (
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${urgencyBadgeClass(post.urgency_level)}`}
            >
              {t(`relief.urgency.${post.urgency_level}`)}
            </span>
          )}
          {reviewed && (
            <CampaignReviewBadge
              movementType="donation_relief"
              reviewedCampaignType={post.reviewed_campaign_type ?? 'general_campaign'}
            />
          )}
        </div>
        {post.blood_group && (
          <p className="flex items-center gap-2 text-lg font-bold text-rose-900">
            <Droplet className="h-5 w-5 shrink-0" aria-hidden />
            {post.blood_group} {t('relief.bloodNeeded')}
          </p>
        )}
        {post.hospital_or_organizer && (
          <p className="wrap-user-text text-sm text-slate-700">
            <span className="font-semibold text-slate-900">{t('relief.hospital')}:</span>{' '}
            {post.hospital_or_organizer}
          </p>
        )}
        {location && (
          <p className="wrap-user-text flex items-start gap-2 text-sm text-slate-700">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {location}
          </p>
        )}
        {post.donors_needed != null && post.donors_needed > 0 && (
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Users className="h-4 w-4 shrink-0 text-rose-700" aria-hidden />
            {t('relief.donorsNeeded', { count: post.donors_needed })}
            {post.support_count != null && post.support_count > 0 && (
              <span className="font-normal text-slate-600">
                · {formatPledgeProgress(post.support_count, post.donors_needed)}
              </span>
            )}
          </p>
        )}
        {post.needed_by_date && (
          <p className="flex items-center gap-2 text-xs text-slate-600">
            <Calendar className="h-3.5 w-3.5" aria-hidden />
            {t('relief.neededBy')}: {formatEventDate(post.needed_by_date)}
          </p>
        )}
        {post.contact_note && (
          <p className="wrap-user-text rounded-lg bg-white/70 px-3 py-2 text-xs text-slate-600 ring-1 ring-slate-200/60">
            {post.contact_note}
          </p>
        )}
        <p className="text-[11px] leading-relaxed text-slate-500">{t('relief.bloodSafetyNote')}</p>
        <MapPreview post={post} />
      </div>
    )
  }

  if (subtype === 'item_donation') {
    return (
      <div className={`mt-4 space-y-3 rounded-xl border p-4 ${panel}`}>
        {reviewed && (
          <CampaignReviewBadge
            movementType="donation_relief"
            reviewedCampaignType={post.reviewed_campaign_type ?? 'general_campaign'}
          />
        )}
        {post.item_category && (
          <p className="text-xs font-bold uppercase tracking-wide text-amber-800">
            {t(`relief.itemCategories.${post.item_category}`)}
          </p>
        )}
        {post.items_needed && (
          <p className="wrap-user-text text-sm font-semibold text-slate-800">{post.items_needed}</p>
        )}
        {post.beneficiary_group && (
          <p className="wrap-user-text text-sm text-slate-700">
            <span className="font-semibold">{t('relief.beneficiary')}:</span> {post.beneficiary_group}
          </p>
        )}
        {post.collection_location && (
          <p className="wrap-user-text flex items-start gap-2 text-sm text-slate-700">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {post.collection_location}
          </p>
        )}
        {post.quantity_needed != null && post.quantity_needed > 0 && (
          <p className="text-sm font-semibold text-slate-800">
            {formatPledgeProgress(post.support_count ?? 0, post.quantity_needed)}
          </p>
        )}
        {post.relief_deadline && (
          <p className="text-xs text-slate-600">
            {t('relief.deadline')}: {formatEventDate(post.relief_deadline)}
          </p>
        )}
        {post.contact_note && (
          <p className="wrap-user-text rounded-lg bg-white/70 px-3 py-2 text-xs text-slate-600 ring-1 ring-slate-200/60">
            {post.contact_note}
          </p>
        )}
        <MapPreview post={post} />
      </div>
    )
  }

  const goal = post.fundraising_goal_amount ?? 0
  const raised = post.current_raised_amount ?? 0
  const pct = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0
  const showNotReviewed = shouldShowFundraisingNotReviewedMessage(post)

  return (
    <div className={`mt-4 rounded-xl border p-4 ${panel}`}>
      {reviewed ? (
        <div className="mb-3">
          <CampaignReviewBadge
            movementType="fundraising"
            reviewedCampaignType={post.reviewed_campaign_type ?? 'fundraising'}
            prominent
          />
        </div>
      ) : showNotReviewed ? (
        <p className="mb-3 text-xs text-slate-500">{TRUST_TOOLTIPS.fundraisingNotReviewed}</p>
      ) : null}
      {post.fundraising_purpose && (
        <p className="wrap-user-text text-sm font-semibold text-slate-800">{post.fundraising_purpose}</p>
      )}
      {post.beneficiary_description && (
        <p className="wrap-user-text mt-1.5 text-xs leading-relaxed text-slate-600">
          {post.beneficiary_description}
        </p>
      )}
      {post.organizer_transparency_note && (
        <div className="mt-3 rounded-lg border border-sky-200/80 bg-sky-50/50 px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wide text-sky-900">
            {t('relief.transparencyTitle')}
          </p>
          <p className="wrap-user-text mt-1 text-xs leading-relaxed text-slate-700">
            {post.organizer_transparency_note}
          </p>
        </div>
      )}
      {goal > 0 && (
        <div className="mt-3">
          <div className="flex justify-between text-xs font-semibold text-slate-600">
            <span>{formatCurrency(raised)} {t('relief.supportInterest')}</span>
            <span>{t('relief.goal')} {formatCurrency(goal)}</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-sky-200/60">
            <div
              className="h-full rounded-full bg-linear-to-r from-sky-500 to-accent-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
            {t('relief.fundraisingDisclaimer')}
          </p>
        </div>
      )}
    </div>
  )
}
