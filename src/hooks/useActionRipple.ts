import { useCallback, useState } from 'react'

const RIPPLE_MS = 400

/** Adds a short pulse-ripple class on pointer down (pair with `.action-ripple` CSS). */
export function useActionRipple() {
  const [rippling, setRippling] = useState(false)

  const onPointerDown = useCallback(() => {
    setRippling(true)
    window.setTimeout(() => setRippling(false), RIPPLE_MS)
  }, [])

  return {
    onPointerDown,
    rippleClassName: rippling ? 'action-ripple is-rippling' : 'action-ripple',
  }
}
