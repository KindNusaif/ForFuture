import { LocateFixed, Search } from 'lucide-react'
import type {
  ImpactContentFilter,
  ImpactDateFilter,
  ImpactStatusFilter,
} from '../../lib/impactMap'

interface ImpactMapFiltersProps {
  contentType: ImpactContentFilter
  onContentTypeChange: (v: ImpactContentFilter) => void
  district: string
  onDistrictChange: (v: string) => void
  districts: string[]
  status: ImpactStatusFilter
  onStatusChange: (v: ImpactStatusFilter) => void
  dateFilter: ImpactDateFilter
  onDateFilterChange: (v: ImpactDateFilter) => void
  nearMeEnabled: boolean
  onNearMeEnabledChange: (v: boolean) => void
  nearRadiusKm: number
  onNearRadiusKmChange: (v: number) => void
  search: string
  onSearchChange: (v: string) => void
  onUseMyLocation: () => void
  geoLoading: boolean
  geoError: string | null
  hasUserLocation: boolean
}

export default function ImpactMapFilters({
  contentType,
  onContentTypeChange,
  district,
  onDistrictChange,
  districts,
  status,
  onStatusChange,
  dateFilter,
  onDateFilterChange,
  nearMeEnabled,
  onNearMeEnabledChange,
  nearRadiusKm,
  onNearRadiusKmChange,
  search,
  onSearchChange,
  onUseMyLocation,
  geoLoading,
  geoError,
  hasUserLocation,
}: ImpactMapFiltersProps) {
  return (
    <div className="card-surface space-y-4 p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onUseMyLocation}
          disabled={geoLoading}
          className="btn-secondary min-h-10! py-2!"
        >
          <LocateFixed className={`h-4 w-4 ${geoLoading ? 'animate-pulse' : ''}`} />
          {geoLoading ? 'Locating…' : hasUserLocation ? 'Update my location' : 'Use my location'}
        </button>
        <label className="inline-flex items-center gap-2 text-sm text-secondary">
          <input
            type="checkbox"
            checked={nearMeEnabled}
            onChange={(e) => onNearMeEnabledChange(e.target.checked)}
            disabled={!hasUserLocation}
            className="h-4 w-4 rounded border-default text-accent-600 focus:ring-accent-500"
          />
          Near me
        </label>
        {nearMeEnabled && (
          <select
            value={nearRadiusKm}
            onChange={(e) => onNearRadiusKmChange(Number(e.target.value))}
            className="input-field min-h-10! py-1.5! text-sm"
            aria-label="Near me radius"
          >
            <option value={25}>25 km</option>
            <option value={50}>50 km</option>
            <option value={100}>100 km</option>
            <option value={200}>200 km</option>
          </select>
        )}
      </div>
      {geoError && <p className="text-xs text-amber-700">{geoError}</p>}

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search title, area, author…"
          className="input-field w-full min-h-10 py-2 pl-10 pr-3 text-sm"
          aria-label="Search map results"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="form-label block text-xs uppercase tracking-wide text-muted">
          Type
          <select
            value={contentType}
            onChange={(e) => onContentTypeChange(e.target.value as ImpactContentFilter)}
            className="input-field mt-1 w-full text-sm"
          >
            <option value="all">All</option>
            <option value="volunteer">Volunteer</option>
            <option value="civic_action">Civic actions</option>
            <option value="issue">Issues</option>
          </select>
        </label>

        <label className="form-label block text-xs uppercase tracking-wide text-muted">
          District / area
          <select
            value={district}
            onChange={(e) => onDistrictChange(e.target.value)}
            className="input-field mt-1 w-full text-sm"
          >
            <option value="">All areas</option>
            {districts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>

        <label className="form-label block text-xs uppercase tracking-wide text-muted">
          Status
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value as ImpactStatusFilter)}
            className="input-field mt-1 w-full text-sm"
          >
            <option value="all">All</option>
            <option value="upcoming">Upcoming</option>
            <option value="active">Active</option>
            <option value="open">Open</option>
            <option value="past">Past</option>
          </select>
        </label>

        <label className="form-label block text-xs uppercase tracking-wide text-muted">
          Timing
          <select
            value={dateFilter}
            onChange={(e) => onDateFilterChange(e.target.value as ImpactDateFilter)}
            className="input-field mt-1 w-full text-sm"
          >
            <option value="all">All dates</option>
            <option value="upcoming">Upcoming & active only</option>
          </select>
        </label>
      </div>
    </div>
  )
}
