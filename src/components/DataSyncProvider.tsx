import { useEffect } from 'react'
import { ensureRealtimeSyncBridge } from '../lib/realtimeSyncBridge'

/**
 * Mounts the global Supabase realtime → dataSync bridge (one channel per page load).
 * Components subscribe via useDataSync; no per-page duplicate channels.
 */
export default function DataSyncProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    ensureRealtimeSyncBridge()
  }, [])

  return children
}
