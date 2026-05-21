import { useCallback, useEffect, useRef, useState } from 'react'
import { formatError } from '../lib/errors'
import { isRequestAborted } from '../lib/supabaseRequest'
import {
  LOADING_RECOVERY_HINT_MS,
  LOADING_SLOW_HINT_MS,
} from '../lib/requestConfig'

export type AsyncLoadPhase = 'idle' | 'loading' | 'slow' | 'recover' | 'error' | 'success'

export interface UseAsyncLoadOptions<T> {
  /** When false, skips running until true (e.g. wait for auth). */
  enabled?: boolean
  /** Reload when these change (serialized with JSON.stringify). */
  deps?: unknown[]
  slowAfterMs?: number
  recoverAfterMs?: number
  onSuccess?: (data: T) => void
}

export interface UseAsyncLoadResult<T> {
  phase: AsyncLoadPhase
  data: T | null
  error: string | null
  isLoading: boolean
  showSlowHint: boolean
  showRecovery: boolean
  reload: () => void
  cancel: () => void
}

export function useAsyncLoad<T>(
  execute: (signal: AbortSignal) => Promise<T>,
  options: UseAsyncLoadOptions<T> = {},
): UseAsyncLoadResult<T> {
  const {
    enabled = true,
    deps = [],
    slowAfterMs = LOADING_SLOW_HINT_MS,
    recoverAfterMs = LOADING_RECOVERY_HINT_MS,
    onSuccess,
  } = options

  const [phase, setPhase] = useState<AsyncLoadPhase>('idle')
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)

  const requestIdRef = useRef(0)
  const abortRef = useRef<AbortController | null>(null)
  const dataRef = useRef<T | null>(null)
  const slowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const recoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimers = useCallback(() => {
    if (slowTimerRef.current) {
      window.clearTimeout(slowTimerRef.current)
      slowTimerRef.current = null
    }
    if (recoverTimerRef.current) {
      window.clearTimeout(recoverTimerRef.current)
      recoverTimerRef.current = null
    }
  }, [])

  const cancel = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    clearTimers()
  }, [clearTimers])

  const executeRef = useRef(execute)
  const onSuccessRef = useRef(onSuccess)

  const run = useCallback(async () => {
    cancel()
    const controller = new AbortController()
    abortRef.current = controller
    const requestId = ++requestIdRef.current

    setPhase('loading')
    setError(null)

    slowTimerRef.current = window.setTimeout(() => {
      if (requestId !== requestIdRef.current) return
      setPhase((p) => (p === 'loading' ? 'slow' : p))
    }, slowAfterMs)

    recoverTimerRef.current = window.setTimeout(() => {
      if (requestId !== requestIdRef.current) return
      setPhase((p) => (p === 'loading' || p === 'slow' ? 'recover' : p))
    }, recoverAfterMs)

    try {
      const result = await executeRef.current(controller.signal)
      if (requestId !== requestIdRef.current || controller.signal.aborted) return

      setData(result)
      setPhase('success')
      setError(null)
      onSuccessRef.current?.(result)
    } catch (err) {
      if (requestId !== requestIdRef.current) return
      if (isRequestAborted(err)) {
        if (dataRef.current) setPhase('success')
        else setPhase('idle')
        return
      }
      setError(formatError(err))
      setPhase('error')
    } finally {
      if (requestId === requestIdRef.current) {
        clearTimers()
        abortRef.current = null
      }
    }
  }, [cancel, clearTimers, recoverAfterMs, slowAfterMs])

  const reload = useCallback(() => {
    void run()
  }, [run])

  let depsKey = '[]'
  try {
    depsKey = JSON.stringify(deps)
  } catch {
    depsKey = String(deps.length)
  }

  useEffect(() => {
    executeRef.current = execute
    onSuccessRef.current = onSuccess
  }, [execute, onSuccess])

  useEffect(() => {
    dataRef.current = data
  }, [data])

  useEffect(() => {
    if (!enabled) {
      cancel()
      return
    }
    const timer = window.setTimeout(() => {
      void run()
    }, 0)
    return () => {
      window.clearTimeout(timer)
      cancel()
    }
  }, [enabled, depsKey, run, cancel])

  const activePhase: AsyncLoadPhase = enabled ? phase : 'idle'

  return {
    phase: activePhase,
    data: enabled ? data : null,
    error: enabled ? error : null,
    isLoading:
      enabled &&
      (phase === 'loading' || phase === 'slow' || phase === 'recover'),
    showSlowHint: enabled && (phase === 'slow' || phase === 'recover'),
    showRecovery: enabled && phase === 'recover',
    reload,
    cancel,
  }
}
