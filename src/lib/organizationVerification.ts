import { requireSupabase } from './supabase'
import { withTimeout, DEFAULT_REQUEST_TIMEOUT_MS } from './supabaseRequest'
import type { OrganizerVerificationType } from '../types'

export type OrganizationType =
  | 'ngo'
  | 'charity'
  | 'nonprofit'
  | 'youth_organization'
  | 'community_group'
  | 'other'

export type OrgVerificationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'needs_changes'
  | 'approved'
  | 'rejected'

export interface OrganizationVerificationRequest {
  id: string
  applicant_user_id: string
  organization_name: string
  organization_type: OrganizationType
  mission: string
  contact_name: string
  contact_email: string
  contact_phone: string | null
  operating_area: string | null
  website_url: string | null
  social_links: string | null
  registration_reference: string | null
  status: OrgVerificationStatus
  applicant_note: string | null
  admin_note: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

export interface OrgVerificationFormInput {
  organization_name: string
  organization_type: OrganizationType
  mission: string
  contact_name: string
  contact_email: string
  contact_phone?: string
  operating_area?: string
  website_url?: string
  social_links?: string
  registration_reference?: string
  confirm_accuracy: boolean
}

const ORG_TYPE_TO_PROFILE: Record<OrganizationType, OrganizerVerificationType> = {
  ngo: 'ngo',
  charity: 'organization',
  nonprofit: 'organization',
  youth_organization: 'student_society',
  community_group: 'community_partner',
  other: 'organization',
}

export function profileTypeForOrgApplication(type: OrganizationType): OrganizerVerificationType {
  return ORG_TYPE_TO_PROFILE[type] ?? 'organization'
}

export async function fetchMyOrganizationVerificationRequest(): Promise<OrganizationVerificationRequest | null> {
  const client = requireSupabase()
  const { data, error } = await withTimeout(
    client
      .from('organization_verification_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    DEFAULT_REQUEST_TIMEOUT_MS,
  )
  if (error) throw error
  return data as OrganizationVerificationRequest | null
}

export async function submitOrganizationVerification(
  input: OrgVerificationFormInput,
): Promise<OrganizationVerificationRequest> {
  const client = requireSupabase()
  const {
    data: { user },
  } = await client.auth.getUser()
  if (!user) throw new Error('You must be signed in to apply.')

  const row = {
    applicant_user_id: user.id,
    organization_name: input.organization_name.trim(),
    organization_type: input.organization_type,
    mission: input.mission.trim(),
    contact_name: input.contact_name.trim(),
    contact_email: input.contact_email.trim(),
    contact_phone: input.contact_phone?.trim() || null,
    operating_area: input.operating_area?.trim() || null,
    website_url: input.website_url?.trim() || null,
    social_links: input.social_links?.trim() || null,
    registration_reference: input.registration_reference?.trim() || null,
    status: 'submitted' as const,
    updated_at: new Date().toISOString(),
  }

  const existing = await fetchMyOrganizationVerificationRequest()
  if (existing && ['draft', 'needs_changes'].includes(existing.status)) {
    const { data, error } = await withTimeout(
      client
        .from('organization_verification_requests')
        .update(row)
        .eq('id', existing.id)
        .select('*')
        .single(),
      DEFAULT_REQUEST_TIMEOUT_MS,
    )
    if (error) throw error
    return data as OrganizationVerificationRequest
  }

  const { data, error } = await withTimeout(
    client.from('organization_verification_requests').insert(row).select('*').single(),
    DEFAULT_REQUEST_TIMEOUT_MS,
  )
  if (error) throw error
  return data as OrganizationVerificationRequest
}

export async function adminFetchOrgVerificationQueue(
  status?: OrgVerificationStatus | '',
): Promise<OrganizationVerificationRequest[]> {
  const client = requireSupabase()
  const { data, error } = await withTimeout(
    client.rpc('admin_get_org_verification_queue', { p_status: status || null }),
    DEFAULT_REQUEST_TIMEOUT_MS,
  )
  if (error) throw error
  return (data ?? []) as OrganizationVerificationRequest[]
}

export async function adminUpdateOrgVerification(
  requestId: string,
  status: OrgVerificationStatus,
  options?: { adminNote?: string; grantVerification?: boolean; verificationType?: OrganizerVerificationType },
): Promise<void> {
  const client = requireSupabase()
  const { error } = await withTimeout(
    client.rpc('admin_update_org_verification', {
      p_request_id: requestId,
      p_status: status,
      p_admin_note: options?.adminNote ?? null,
      p_grant_verification: options?.grantVerification ?? false,
      p_verification_type: options?.verificationType ?? 'organization',
    }),
    DEFAULT_REQUEST_TIMEOUT_MS,
  )
  if (error) throw error
}
