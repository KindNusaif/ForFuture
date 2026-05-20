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
  onRequestLocationForNearMe: () => void
  geoLoading: boolean
  geoError: string | null
  hasUserLocation: boolean
  detectedAreaLabel?: string | null
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
  onRequestLocationForNearMe,
  geoLoading,
  geoError,
  hasUserLocation,
  detectedAreaLabel,
}: ImpactMapFiltersProps) {
  function handleNearMeChange(checked: boolean) {
    if (checked && !hasUserLocation) {
      onRequestLocationForNearMe()
      return
    }
    onNearMeEnabledChange(checked)
  }

  return (
    <div className="card-surface space-y-4 p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onUseMyLocation}
          disabled={geoLoading}
          aria-busy={geoLoading}
          aria-label={hasUserLocation ? 'Update my location on the map' : 'Use my location on the map'}
          className={`btn-secondary min-h-10! py-2! ${nearMeEnabled && hasUserLocation ? 'ring-2 ring-accent-500/40' : ''}`}
        >
          <LocateFixed className={`h-4 w-4 ${geoLoading ? 'animate-pulse' : ''}`} aria-hidden />
          {geoLoading ? 'Locating…' : hasUserLocation ? 'Update my location' : 'Use my location'}
        </button>
        <label
          className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
            nearMeEnabled && hasUserLocation
              ? 'border-accent-300 bg-accent-50/80 text-accent-900'
              : 'border-default text-secondary'
          }`}
        >
          <input
            type="checkbox"
            checked={nearMeEnabled && hasUserLocation}
            onChange={(e) => handleNearMeChange(e.target.checked)}
            className="h-4 w-4 rounded border-default text-accent-600 focus:ring-accent-500"
            aria-label="Filter results near me"
          />
          Near me
        </label>
        {nearMeEnabled && hasUserLocation && (
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
      {detectedAreaLabel && hasUserLocation && (
        <p className="text-xs text-secondary">
          <span className="font-medium text-primary">Detected area:</span> {detectedAreaLabel}
        </p>
      )}
      {geoError && (
        <p className="rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs text-amber-900" role="status">
          {geoError}
        </p>
      )}
      {!hasUserLocation && !geoError && (
        <p className="text-xs text-muted">Enable location for nearby filtering, or choose a district below.</p>
      )}

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
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
            <option value="relief">Relief</option>
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
