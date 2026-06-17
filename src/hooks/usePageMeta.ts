import { useEffect } from 'react'
import { getAppOrigin } from '../lib/appUrl'

interface PageMetaOptions {
  title: string
  description?: string
  /** Path only, e.g. `/explore` — used for og:url */
  path?: string
  image?: string
  /** When false, set noindex. Default true. */
  indexable?: boolean
}

type MetaKey = { attr: 'name' | 'property'; key: string }

function metaSelector({ attr, key }: MetaKey): string {
  return `meta[${attr}="${key}"]`
}

function readMetaContent(metaKey: MetaKey): string | null {
  const el = document.querySelector(metaSelector(metaKey)) as HTMLMetaElement | null
  return el?.getAttribute('content') ?? null
}

function upsertMeta(metaKey: MetaKey, content: string): void {
  let el = document.querySelector(metaSelector(metaKey)) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(metaKey.attr, metaKey.key)
    document.head.appendChild(el)
  }
  el.content = content
}

const MANAGED_META_KEYS: MetaKey[] = [
  { attr: 'name', key: 'description' },
  { attr: 'name', key: 'robots' },
  { attr: 'property', key: 'og:title' },
  { attr: 'property', key: 'og:description' },
  { attr: 'property', key: 'og:url' },
  { attr: 'property', key: 'og:image' },
  { attr: 'name', key: 'twitter:title' },
  { attr: 'name', key: 'twitter:description' },
]

/** Sets document title and OG/Twitter meta for the current route (SPA). */
export function usePageMeta({
  title,
  description,
  path,
  image,
  indexable = true,
}: PageMetaOptions): void {
  useEffect(() => {
    const previousTitle = document.title
    const previousMeta = new Map<string, string | null>()
    for (const metaKey of MANAGED_META_KEYS) {
      previousMeta.set(metaSelector(metaKey), readMetaContent(metaKey))
    }

    const fullTitle = title.includes('ForFuture') ? title : `${title} · ForFuture`
    document.title = fullTitle

    const origin = getAppOrigin()
    const imageUrl = image ?? `${origin}/favicon.svg`

    upsertMeta({ attr: 'property', key: 'og:title' }, fullTitle)
    upsertMeta({ attr: 'name', key: 'twitter:title' }, fullTitle)
    upsertMeta({ attr: 'property', key: 'og:url' }, path ? `${origin}${path}` : origin)
    upsertMeta({ attr: 'property', key: 'og:image' }, imageUrl)

    if (description) {
      upsertMeta({ attr: 'name', key: 'description' }, description)
      upsertMeta({ attr: 'property', key: 'og:description' }, description)
      upsertMeta({ attr: 'name', key: 'twitter:description' }, description)
    }

    upsertMeta(
      { attr: 'name', key: 'robots' },
      indexable ? 'index, follow' : 'noindex, nofollow',
    )

    return () => {
      document.title = previousTitle
      for (const metaKey of MANAGED_META_KEYS) {
        const selector = metaSelector(metaKey)
        const previous = previousMeta.get(selector)
        if (previous === null) continue
        if (previous === undefined) continue
        upsertMeta(metaKey, previous)
      }
    }
  }, [title, description, path, image, indexable])
}
