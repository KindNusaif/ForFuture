import { useEffect, useRef } from 'react'
import { subscribeDataSync, type DataSyncEvent } from '../lib/dataSync'

export function useDataSync(
  handler: (event: DataSyncEvent) => void,
  enabled = true,
): void {
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    if (!enabled) return
    return subscribeDataSync((event) => {
      handlerRef.current(event)
    })
  }, [enabled])
}
