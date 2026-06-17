import { useEffect, useRef, type RefObject } from 'react'

interface UseRevealOnScrollOptions {
  /** Stagger delay in ms for list children (max 5). */
  staggerMs?: number
  /** Root margin passed to IntersectionObserver. */
  rootMargin?: string
  /** Disable reveal (e.g. reduced motion handled via CSS). */
  disabled?: boolean
}

/**
 * Adds `.is-revealed` when the element enters the viewport.
 * Pair with `.reveal-on-scroll` styles in design-system.css.
 */
export function useRevealOnScroll<T extends HTMLElement>(
  ref: RefObject<T | null>,
  { staggerMs = 60, rootMargin = '0px 0px -8% 0px', disabled = false }: UseRevealOnScrollOptions = {},
): void {
  const revealedRef = useRef(false)

  useEffect(() => {
    const node = ref.current
    if (!node || disabled) return

    if (typeof IntersectionObserver === 'undefined') {
      node.classList.add('is-revealed')
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || revealedRef.current) continue
          revealedRef.current = true
          entry.target.classList.add('is-revealed')

          const children = entry.target.querySelectorAll('[data-reveal-child]')
          children.forEach((child, index) => {
            if (index < 5) {
              ;(child as HTMLElement).style.transitionDelay = `${index * staggerMs}ms`
            }
            child.classList.add('is-revealed')
          })

          observer.unobserve(entry.target)
        }
      },
      { rootMargin, threshold: 0.08 },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [ref, staggerMs, rootMargin, disabled])
}
