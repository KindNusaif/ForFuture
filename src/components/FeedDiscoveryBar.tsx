import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, Plus, Search } from 'lucide-react'
import CategoryFilter from './CategoryFilter'
import MovementTypeFilter from './MovementTypeFilter'
import type { Category } from '../types'
import type { MovementFilter } from '../lib/movements'

interface FeedDiscoveryBarProps {
  search: string
  onSearchChange: (value: string) => void
  movementFilter: MovementFilter
  onMovementFilterChange: (value: MovementFilter) => void
  category: Category | 'All'
  onCategoryChange: (category: Category | 'All') => void
  isGuest: boolean
  showCreateButton?: boolean
  onGuestCreate?: () => void
}

export default function FeedDiscoveryBar({
  search,
  onSearchChange,
  movementFilter,
  onMovementFilterChange,
  category,
  onCategoryChange,
  isGuest,
  showCreateButton = true,
  onGuestCreate,
}: FeedDiscoveryBarProps) {
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false)
  const categoryActive = category !== 'All'

  return (
    <div className="card-surface mb-5 overflow-hidden p-3 sm:p-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="relative min-w-0 flex-1 basis-[12rem]">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <input
              type="search"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search movements, authors, topics…"
              className="search-input"
              aria-label="Search movements"
            />
          </div>

          {!isGuest && showCreateButton && (
            <Link to="/create" className="btn-primary shrink-0 !min-h-[42px] !py-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New movement</span>
              <span className="sm:hidden">New</span>
            </Link>
          )}

          {isGuest && onGuestCreate && (
            <button
              type="button"
              onClick={onGuestCreate}
              className="btn-secondary shrink-0 !min-h-[42px] !py-2"
            >
              <Plus className="h-4 w-4" />
              Start
            </button>
          )}

          <button
            type="button"
            onClick={() => setMoreFiltersOpen((o) => !o)}
            className={`filter-chip gap-1.5 px-3 py-2 text-sm ${
              moreFiltersOpen || categoryActive ? 'filter-chip-active' : ''
            }`}
            aria-expanded={moreFiltersOpen}
          >
            More filters
            {categoryActive && !moreFiltersOpen && (
              <span className="rounded-full bg-accent-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                1
              </span>
            )}
            <ChevronDown
              className={`h-4 w-4 transition ${moreFiltersOpen ? 'rotate-180' : ''}`}
              aria-hidden
            />
          </button>
        </div>

        <MovementTypeFilter
          selected={movementFilter}
          onChange={onMovementFilterChange}
          compact
        />

        {moreFiltersOpen && (
          <div className="border-t border-default pt-3">
            <CategoryFilter selected={category} onChange={onCategoryChange} compact />
          </div>
        )}
      </div>
    </div>
  )
}
