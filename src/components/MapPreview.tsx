import { ExternalLink, MapPin } from 'lucide-react'
import {
  getDisplayLocationName,
  getStaticMapUrl,
  hasValidCoordinates,
  isGoogleMapsConfigured,
} from '../lib/googleMaps'
import type { Post } from '../types'

interface MapPreviewProps {
  post: Post
  className?: string
}

function buildMapsUrl(post: Post, name: string): string {
  const lat = post.latitude
  const lng = post.longitude
  if (lat != null && lng != null && hasValidCoordinates({ latitude: lat, longitude: lng })) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`
}

export default function MapPreview({ post, className = '' }: MapPreviewProps) {
  const name = getDisplayLocationName(post)
  const coords = {
    latitude: post.latitude ?? null,
    longitude: post.longitude ?? null,
  }
  const staticUrl =
    hasValidCoordinates(coords) && isGoogleMapsConfigured()
      ? getStaticMapUrl(coords.latitude, coords.longitude, { height: 200 })
      : null

  if (!name && !staticUrl) return null

  const mapsUrl = name ? buildMapsUrl(post, name) : null

  return (
    <div className={`overflow-hidden rounded-xl border border-default bg-surface ${className}`}>
      {staticUrl ? (
        <img
          src={staticUrl}
          alt={`Map showing ${name ?? 'event location'}`}
          width={640}
          height={200}
          className="h-36 w-full object-cover sm:h-40"
          loading="lazy"
          decoding="async"
        />
      ) : null}

      {name && (
        <div
          className={`flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 ${
            staticUrl ? 'border-t border-default' : ''
          }`}
        >
          <p className="wrap-user-text flex min-w-0 items-start gap-2 text-sm font-medium text-primary">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" aria-hidden />
            <span>{name}</span>
          </p>
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-accent-700 ring-1 ring-accent-200/90 transition hover:bg-accent-50"
            >
              Open location
              <ExternalLink className="h-3 w-3" aria-hidden />
            </a>
          )}
        </div>
      )}
    </div>
  )
}
