import { Link } from 'react-router-dom'
import { X } from 'lucide-react'
import {
  formatImpactDate,
  getCtaLabel,
  getLayerLabel,
  getStatusLabel,
  type ImpactMapEntry,
} from '../../lib/impactMap'

interface ImpactMapDetailProps {
  entry: ImpactMapEntry
  detailPath: string
  onClose: () => void
}

export default function ImpactMapDetail({ entry, detailPath, onClose }: ImpactMapDetailProps) {
  return (
    <div className="card-surface flex flex-col overflow-hidden lg:max-h-[min(420px,50vh)]">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-4">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wide text-accent-600">
            {getLayerLabel(entry.layerType)}
          </p>
          <h2 className="wrap-user-text mt-1 text-lg font-bold text-slate-900">{entry.title}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-slate-100"
          aria-label="Close details"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-3 overflow-y-auto p-4 text-sm">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
            {getStatusLabel(entry.status)}
          </span>
          <span className="rounded-full bg-accent-50 px-2.5 py-0.5 text-xs font-semibold text-accent-800 ring-1 ring-accent-200">
            {entry.category}
          </span>
          {entry.isApproximatePin && (
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-900 ring-1 ring-amber-200">
              Approximate map location
            </span>
          )}
        </div>

        {(entry.district || entry.locationLabel) && (
          <p className="text-slate-600">
            <span className="font-semibold text-slate-800">Location: </span>
            {entry.locationLabel ?? entry.district}
            {entry.district && entry.locationLabel && entry.locationLabel !== entry.district
              ? ` · ${entry.district}`
              : ''}
          </p>
        )}

        {formatImpactDate(entry) && (
          <p className="text-slate-600">
            <span className="font-semibold text-slate-800">When: </span>
            {formatImpactDate(entry)}
            {entry.scheduledTime ? ` · ${entry.scheduledTime}` : ''}
          </p>
        )}

        <p className="wrap-user-text leading-relaxed text-slate-600">{entry.description}</p>

        {entry.issueSummary && (
          <p className="wrap-user-text rounded-lg bg-rose-50/80 p-3 text-slate-700">
            <span className="font-semibold">Issue: </span>
            {entry.issueSummary}
          </p>
        )}

        <p className="text-xs text-slate-500">
          {entry.authorName.startsWith('Youth Voice') ? (
            <>Shared via {entry.authorName}</>
          ) : (
            <>
              Organizer / reporter: <span className="font-medium">{entry.authorName}</span>
            </>
          )}
        </p>
      </div>

      <div className="border-t border-slate-100 p-4">
        <Link to={detailPath} className="btn-primary w-full text-center">
          {getCtaLabel(entry.layerType)}
        </Link>
      </div>
    </div>
  )
}
