import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, Plus, Search, X } from 'lucide-react'
import CreateMovementCta from './create/CreateMovementCta'
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
  onClearFilters?: () => void
  hasActiveFilters?: boolean
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
  onClearFilters,
  hasActiveFilters = false,
}: FeedDiscoveryBarProps) {
  const { t } = useTranslation()
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false)
  const categoryActive = category !== 'All'
  const typeActive = movementFilter !== 'All'
  const searchActive = search.trim().length > 0
  const filtersActive = hasActiveFilters || categoryActive || typeActive || searchActive

  return (
    <div className="card-surface mb-5 min-w-0 p-3 sm:p-4">
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
              placeholder={t('feed.searchPlaceholder', {
                defaultValue: 'Search movements, authors, topics…',
              })}
              className="search-input"
              aria-label={t('feed.searchPlaceholder', {
                defaultValue: 'Search movements, authors, topics…',
              })}
            />
          </div>

          {!isGuest && showCreateButton && (
            <CreateMovementCta className="shrink-0 py-2!" compact variant="secondary" />
          )}

          {isGuest && onGuestCreate && (
            <button
              type="button"
              onClick={onGuestCreate}
              className="btn-secondary shrink-0 min-h-10.5! py-2!"
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
            {t('feed.moreFilters', { defaultValue: 'More filters' })}
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

          {filtersActive && onClearFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="filter-chip gap-1.5 px-3 py-2 text-sm"
              aria-label="Clear all filters and search"
            >
              <X className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">{t('feed.clearFilters')}</span>
            </button>
          )}
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
