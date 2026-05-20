import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'

const NEARBY_SECTION_ID = 'nearby-actions'
const SPOTLIGHT_CLASS = 'discover-nearby-spotlight'

/** Smooth-scroll to the nearby discovery block once when `?focus=nearby`. */
export function useDiscoverNearbyFocus(enabled = true) {
  const [searchParams] = useSearchParams()
  const didScroll = useRef(false)

  useEffect(() => {
    if (!enabled) return
    if (searchParams.get('focus') !== 'nearby') return
    if (didScroll.current) return

    const scrollTimer = window.setTimeout(() => {
      const el = document.getElementById(NEARBY_SECTION_ID)
      if (!el || didScroll.current) return

      didScroll.current = true
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      el.classList.add(SPOTLIGHT_CLASS)

      window.setTimeout(() => {
        el.classList.remove(SPOTLIGHT_CLASS)
      }, 2600)
    }, 150)

    return () => window.clearTimeout(scrollTimer)
  }, [enabled, searchParams])
}

export function scrollToDiscoverTrending() {
  document.getElementById('discover-trending')?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })
}
