import { getDisplayLocationName, hasValidCoordinates } from './googleMaps'
import { enhanceSupabaseError, isMissingColumn, isMissingRelation } from './supabaseErrors'
import { requireSupabase } from './supabase'
import { FEED_REQUEST_TIMEOUT_MS, withTimeout } from './supabaseRequest'
import type { MovementType, PostingIdentity } from '../types'

const FEED_SOURCE = 'posts_public_safe' as const
export const IMPACT_MAP_FETCH_LIMIT = 400

export const IMPACT_MAP_MOVEMENT_TYPES = [
  'volunteer_drive',
  'peaceful_civic_action',
  'raise_voice',
  'donation_relief',
] as const satisfies readonly MovementType[]

export type ImpactMapMovementType = (typeof IMPACT_MAP_MOVEMENT_TYPES)[number]

export type ImpactLayerType = 'volunteer' | 'civic_action' | 'issue' | 'relief'

export type ImpactMapStatus = 'upcoming' | 'active' | 'past' | 'open'

export const IMPACT_MAP_COLUMNS = [
  'id',
  'title',
  'description',
  'category',
  'author_name',
  'posting_identity',
  'movement_type',
  'created_at',
  'event_date',
  'event_time',
  'location',
  'action_date',
  'action_time',
  'action_location',
  'location_name',
  'latitude',
  'longitude',
  'issue_summary',
  'hospital_or_organizer',
  'collection_location',
].join(', ')

export const IMPACT_MAP_COLUMNS_LEGACY = IMPACT_MAP_COLUMNS

export interface ImpactMapEntry {
  id: string
  layerType: ImpactLayerType
  movementType: ImpactMapMovementType
  title: string
  description: string
  category: string
  authorName: string
  district: string | null
  locationLabel: string | null
  latitude: number | null
  longitude: number | null
  hasPreciseCoordinates: boolean
  /** Approximate pin from district label only — not GPS-precise */
  isApproximatePin: boolean
  scheduledAt: string | null
  scheduledTime: string | null
  reportedAt: string
  status: ImpactMapStatus
  issueSummary: string | null
}

export type ImpactContentFilter = 'all' | ImpactLayerType

export type ImpactStatusFilter = 'all' | ImpactMapStatus

export type ImpactDateFilter = 'all' | 'upcoming'

export interface ImpactMapFetchParams {
  layerType?: ImpactContentFilter
}

export interface ImpactMapClientFilters {
  contentType: ImpactContentFilter
  district: string
  status: ImpactStatusFilter
  dateFilter: ImpactDateFilter
  nearMeEnabled: boolean
  nearRadiusKm: number
  userLocation: { lat: number; lng: number } | null
  search: string
}

const LAYER_BY_MOVEMENT: Record<ImpactMapMovementType, ImpactLayerType> = {
  volunteer_drive: 'volunteer',
  peaceful_civic_action: 'civic_action',
  raise_voice: 'issue',
  donation_relief: 'relief',
}

function movementToLayer(mt: string): ImpactLayerType | null {
  if (mt === 'volunteer_drive') return 'volunteer'
  if (mt === 'peaceful_civic_action') return 'civic_action'
  if (mt === 'raise_voice') return 'issue'
  if (mt === 'donation_relief') return 'relief'
  return null
}

export function extractDistrict(label: string | null): string | null {
  if (!label?.trim()) return null
  const parts = label.split(',').map((p) => p.trim()).filter(Boolean)
  if (parts.length >= 2) return parts[0]
  return label.trim()
}

function startOfToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export function computeImpactStatus(
  movementType: ImpactMapMovementType,
  eventDate: string | null,
  actionDate: string | null,
): ImpactMapStatus {
  if (movementType === 'raise_voice' || movementType === 'donation_relief') return 'open'

  const dateStr = movementType === 'volunteer_drive' ? eventDate : actionDate
  if (!dateStr?.trim()) return 'active'

  const parsed = new Date(dateStr)
  if (Number.isNaN(parsed.getTime())) return 'active'

  const today = startOfToday()
  if (parsed >= today) return 'upcoming'
  return 'past'
}

function mapRow(row: Record<string, unknown>): ImpactMapEntry | null {
  const movementType = row.movement_type as string
  const layerType = movementToLayer(movementType)
  if (!layerType) return null

  const mt = movementType as ImpactMapMovementType
  const locationLabel = getDisplayLocationName({
    location_name: row.location_name as string | null,
    location: row.location as string | null,
    action_location: row.action_location as string | null,
    hospital_or_organizer: row.hospital_or_organizer as string | null,
    collection_location: row.collection_location as string | null,
    movement_type: movementType,
  })

  const district =
    extractDistrict(locationLabel) ??
    extractDistrict((row.location as string) ?? null) ??
    extractDistrict((row.action_location as string) ?? null)

  const lat = row.latitude != null ? Number(row.latitude) : null
  const lng = row.longitude != null ? Number(row.longitude) : null
  const coords = { latitude: lat, longitude: lng }
  const hasPrecise = hasValidCoordinates(coords)

  const latitude: number | null = hasPrecise ? lat : null
  const longitude: number | null = hasPrecise ? lng : null

  const eventDate = (row.event_date as string | null) ?? null
  const actionDate = (row.action_date as string | null) ?? null
  const scheduledAt = mt === 'volunteer_drive' ? eventDate : mt === 'peaceful_civic_action' ? actionDate : null
  const scheduledTime =
    mt === 'volunteer_drive'
      ? (row.event_time as string | null)
      : mt === 'peaceful_civic_action'
        ? (row.action_time as string | null)
        : null

  return {
    id: row.id as string,
    layerType,
    movementType: mt,
    title: row.title as string,
    description: row.description as string,
    category: row.category as string,
    authorName: row.author_name as string,
    district,
    locationLabel,
    latitude,
    longitude,
    hasPreciseCoordinates: hasPrecise,
    isApproximatePin: false,
    scheduledAt,
    scheduledTime,
    reportedAt: row.created_at as string,
    status: computeImpactStatus(mt, eventDate, actionDate),
    issueSummary: (row.issue_summary as string | null) ?? null,
  }
}

export async function fetchImpactMapEntries(
  params: ImpactMapFetchParams = {},
): Promise<ImpactMapEntry[]> {
  const client = requireSupabase()

  const typesToFetch =
    params.layerType && params.layerType !== 'all'
      ? IMPACT_MAP_MOVEMENT_TYPES.filter((t) => LAYER_BY_MOVEMENT[t] === params.layerType)
      : [...IMPACT_MAP_MOVEMENT_TYPES]

  async function runQuery(columns: string) {
    const q = client
      .from(FEED_SOURCE)
      .select(columns)
      .in('movement_type', typesToFetch)
      .order('created_at', { ascending: false })
      .limit(IMPACT_MAP_FETCH_LIMIT)

    return q
  }

  const { data, error } = await withTimeout(runQuery(IMPACT_MAP_COLUMNS), FEED_REQUEST_TIMEOUT_MS)

  if (error) {
    if (isMissingRelation(error)) throw enhanceSupabaseError(error)
    if (isMissingColumn(error)) {
      const fallback = await withTimeout(
        runQuery(IMPACT_MAP_COLUMNS_LEGACY),
        FEED_REQUEST_TIMEOUT_MS,
      )
      if (fallback.error) throw enhanceSupabaseError(fallback.error)
      return (fallback.data ?? [])
        .map((row) => mapRow(row as unknown as Record<string, unknown>))
        .filter((e): e is ImpactMapEntry => e != null)
    }
    throw enhanceSupabaseError(error)
  }

  return (data ?? [])
    .map((row) => mapRow(row as unknown as Record<string, unknown>))
    .filter((e): e is ImpactMapEntry => e != null)
}

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function filterImpactMapEntries(
  entries: ImpactMapEntry[],
  filters: ImpactMapClientFilters,
): ImpactMapEntry[] {
  let list = entries

  if (filters.contentType !== 'all') {
    list = list.filter((e) => e.layerType === filters.contentType)
  }

  if (filters.district) {
    list = list.filter((e) => e.district === filters.district)
  }

  if (filters.status !== 'all') {
    list = list.filter((e) => e.status === filters.status)
  }

  if (filters.dateFilter === 'upcoming') {
    list = list.filter((e) => e.status === 'upcoming' || e.status === 'active')
  }

  if (filters.nearMeEnabled && filters.userLocation) {
    const { lat, lng } = filters.userLocation
    list = list.filter((e) => {
      if (e.latitude == null || e.longitude == null) return false
      return haversineKm(lat, lng, e.latitude, e.longitude) <= filters.nearRadiusKm
    })
    list = [...list].sort((a, b) => {
      const da = haversineKm(lat, lng, a.latitude!, a.longitude!)
      const db = haversineKm(lat, lng, b.latitude!, b.longitude!)
      return da - db
    })
  }

  const q = filters.search.trim().toLowerCase()
  if (q) {
    list = list.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.district?.toLowerCase().includes(q) ||
        e.locationLabel?.toLowerCase().includes(q) ||
        e.authorName.toLowerCase().includes(q),
    )
  }

  return list
}

export function getMappableEntries(entries: ImpactMapEntry[]): ImpactMapEntry[] {
  return entries.filter((e) => e.hasPreciseCoordinates && e.latitude != null && e.longitude != null)
}

export function getUniqueDistricts(entries: ImpactMapEntry[]): string[] {
  const set = new Set<string>()
  for (const e of entries) {
    if (e.district) set.add(e.district)
  }
  return [...set].sort((a, b) => a.localeCompare(b))
}

export function getLayerLabel(layer: ImpactLayerType): string {
  switch (layer) {
    case 'volunteer':
      return 'Volunteer Event'
    case 'civic_action':
      return 'Peaceful Civic Action'
    case 'issue':
      return 'Community Issue'
    case 'relief':
      return 'Relief Campaign'
  }
}

export function getCtaLabel(layer: ImpactLayerType): string {
  switch (layer) {
    case 'volunteer':
      return 'View Event'
    case 'civic_action':
      return 'View Action'
    case 'issue':
      return 'View Issue'
    case 'relief':
      return 'View Relief'
  }
}

export function getStatusLabel(status: ImpactMapStatus): string {
  switch (status) {
    case 'upcoming':
      return 'Upcoming'
    case 'active':
      return 'Active'
    case 'past':
      return 'Past'
    case 'open':
      return 'Open'
  }
}

export function formatImpactDate(entry: ImpactMapEntry): string | null {
  if (entry.scheduledAt) {
    const d = new Date(entry.scheduledAt)
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    }
  }
  const reported = new Date(entry.reportedAt)
  if (!Number.isNaN(reported.getTime())) {
    return `Reported ${reported.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
  }
  return null
}

export type { PostingIdentity }
