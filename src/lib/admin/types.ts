export type AdminStatKey =
  | 'total_users'
  | 'total_posts'
  | 'total_petitions'
  | 'total_polls'
  | 'total_volunteer_drives'
  | 'total_reports_pending'

export interface AdminStats {
  totalUsers: number | null
  totalPosts: number | null
  totalPetitions: number | null
  totalPolls: number | null
  totalVolunteerDrives: number | null
  totalReportsPending: number | null
  /** True when admin_get_platform_stats RPC is unavailable */
  statsUnavailable: boolean
}

export interface AdminUser {
  id: string
  displayName: string | null
  youthVoiceId: string | null
  role: 'admin' | 'user'
  isVerifiedOrganizer: boolean
  createdAt: string | null
  status: 'active' | 'unknown'
}

export interface AdminContentItem {
  id: string
  title: string
  description: string
  movementType: string
  category: string | null
  authorName: string
  postingIdentity: string
  publicationStatus: string | null
  createdAt: string
}

export interface AdminReportItem {
  id: string
  source: 'content' | 'comment'
  contentType: string
  contentId: string
  reportReason: string
  status: string
  priority: string | null
  contentTitle: string | null
  createdAt: string
}

export interface AdminRecentActivity {
  activityType: 'user' | 'post' | string
  activityId: string
  title: string
  createdAt: string
}
