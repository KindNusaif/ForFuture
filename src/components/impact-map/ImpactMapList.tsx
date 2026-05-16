import { useEffect, useRef } from 'react'
import { MapPin, MapPinOff } from 'lucide-react'
import {
  formatImpactDate,
  getLayerLabel,
  getStatusLabel,
  type ImpactMapEntry,
} from '../../lib/impactMap'

interface ImpactMapListProps {
  entries: ImpactMapEntry[]
  selectedId: string | null
  onSelect: (entry: ImpactMapEntry) => void
  mobileExpanded: boolean
  onToggleMobile: () => void
}

const LAYER_RING: Record<ImpactMapEntry['layerType'], string> = {
  volunteer: 'ring-brand-200 border-brand-200',
  civic_action: 'ring-accent-200 border-accent-200',
  issue: 'ring-rose-200 border-rose-200',
}

export default function ImpactMapList({
  entries,
  selectedId,
  onSelect,
  mobileExpanded,
  onToggleMobile,
}: ImpactMapListProps) {
  const listRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    if (!selectedId || !listRef.current) return
    const el = listRef.current.querySelector(`[data-entry-id="${selectedId}"]`)
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [selectedId])

  return (
    <div className="flex h-full min-h-0 flex-col">
      <button
        type="button"
        className="flex items-center justify-between border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-800 lg:pointer-events-none"
        onClick={onToggleMobile}
        aria-expanded={mobileExpanded}
      >
        <span>Results ({entries.length})</span>
        <span className="text-accent-600 lg:hidden">{mobileExpanded ? 'Hide' : 'Show'}</span>
      </button>

      <ul
        ref={listRef}
        className={`min-h-0 flex-1 overflow-y-auto p-2 ${mobileExpanded ? 'block' : 'hidden lg:block'}`}
      >
        {entries.map((entry) => {
          const selected = entry.id === selectedId
          const hasPin = entry.latitude != null && entry.longitude != null
          return (
            <li key={entry.id} className="mb-2">
              <button
                type="button"
                data-entry-id={entry.id}
                onClick={() => onSelect(entry)}
                className={`w-full rounded-xl border p-3 text-left transition ${
                  selected
                    ? `bg-accent-50/80 ring-2 ring-accent-500/30 ${LAYER_RING[entry.layerType]}`
                    : `bg-white hover:bg-slate-50 ${LAYER_RING[entry.layerType]}`
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    {getLayerLabel(entry.layerType)}
                  </span>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                    {getStatusLabel(entry.status)}
                  </span>
                </div>
                <p className="wrap-user-text mt-1 text-sm font-semibold text-slate-900">
                  {entry.title}
                </p>
                {entry.district && (
                  <p className="mt-0.5 text-xs text-slate-500">{entry.district}</p>
                )}
                {formatImpactDate(entry) && (
                  <p className="mt-1 text-xs text-slate-500">{formatImpactDate(entry)}</p>
                )}
                <p className="mt-2 flex items-center gap-1 text-[10px] text-slate-500">
                  {hasPin ? (
                    <>
                      <MapPin className="h-3 w-3" aria-hidden />
                      {entry.isApproximatePin
                        ? 'Approximate area on map'
                        : entry.hasPreciseCoordinates
                          ? 'On map'
                          : 'On map'}
                    </>
                  ) : (
                    <>
                      <MapPinOff className="h-3 w-3" aria-hidden />
                      List only — no map pin
                    </>
                  )}
                </p>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
