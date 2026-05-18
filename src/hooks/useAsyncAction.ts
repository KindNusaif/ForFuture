import { useCallback, useRef, useState } from 'react'

/**
 * Wraps an async handler so only one invocation runs at a time.
 * Returns [run, isRunning] for disabling buttons and showing loading labels.
 */
export function useAsyncAction<T extends unknown[]>(
  action: (...args: T) => Promise<void>,
): [(...args: T) => Promise<void>, boolean] {
  const runningRef = useRef(false)
  const [running, setRunning] = useState(false)

  const run = useCallback(
    async (...args: T) => {
      if (runningRef.current) return
      runningRef.current = true
      setRunning(true)
      try {
        await action(...args)
      } finally {
        runningRef.current = false
        setRunning(false)
      }
    },
    [action],
  )

  return [run, running]
}
