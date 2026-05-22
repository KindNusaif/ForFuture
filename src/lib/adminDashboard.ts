import { fetchCommentModerationQueue } from './comments'
import { fetchModerationQueue } from './contentReports'
import { adminFetchOrgVerificationQueue } from './organizationVerification'
import { fetchCampaignReviewQueue } from './trustAdmin'

export interface AdminDashboardSummary {
  contentReportsPending: number | null
  commentReportsPending: number | null
  campaignsPending: number | null
  orgVerificationPending: number | null
  loadErrors: string[]
}

function isPendingContentReport(status: string) {
  return status === 'submitted' || status === 'under_review'
}

function isPendingCommentReport(status: string) {
  return status === 'open' || status === 'reviewing'
}

function isPendingCampaignReview(status: string) {
  return status === 'unreviewed' || status === 'under_review'
}

function isPendingOrgVerification(status: string) {
  return status === 'submitted' || status === 'under_review'
}

/** Loads queue sizes for the admin hub using existing admin RPCs (no new SQL). */
export async function fetchAdminDashboardSummary(): Promise<AdminDashboardSummary> {
  const [contentResult, commentResult, campaignResult, orgResult] = await Promise.allSettled([
    fetchModerationQueue(),
    fetchCommentModerationQueue(),
    fetchCampaignReviewQueue(null, null),
    adminFetchOrgVerificationQueue(),
  ])

  const loadErrors: string[] = []

  let contentReportsPending: number | null = null
  if (contentResult.status === 'fulfilled') {
    contentReportsPending = contentResult.value.filter((item) =>
      isPendingContentReport(item.status),
    ).length
  } else {
    loadErrors.push('content reports')
  }

  let commentReportsPending: number | null = null
  if (commentResult.status === 'fulfilled') {
    commentReportsPending = commentResult.value.filter((item) =>
      isPendingCommentReport(item.status),
    ).length
  } else {
    loadErrors.push('comment reports')
  }

  let campaignsPending: number | null = null
  if (campaignResult.status === 'fulfilled') {
    campaignsPending = campaignResult.value.filter((item) =>
      isPendingCampaignReview(item.review_status),
    ).length
  } else {
    loadErrors.push('campaign reviews')
  }

  let orgVerificationPending: number | null = null
  if (orgResult.status === 'fulfilled') {
    orgVerificationPending = orgResult.value.filter((item) =>
      isPendingOrgVerification(item.status),
    ).length
  } else {
    loadErrors.push('organization verification')
  }

  return {
    contentReportsPending,
    commentReportsPending,
    campaignsPending,
    orgVerificationPending,
    loadErrors,
  }
}
