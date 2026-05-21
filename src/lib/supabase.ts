import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL?.trim().split('\n')[0]
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim().split('\n')[0]

const isPlaceholder =
  !url ||
  !anonKey ||
  url.includes('your-project') ||
  anonKey === 'your-anon-key' ||
  anonKey.startsWith('npx ')

/** True when real Supabase credentials are in .env */
export const isSupabaseConfigured = !isPlaceholder

/** True when the client singleton initialized successfully */
export function isSupabaseClientReady(): boolean {
  return Boolean(supabase)
}

let client: SupabaseClient | null = null
let clientInitError: string | null = null

function getClient(): SupabaseClient {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.',
    )
  }
  if (client) return client
  if (clientInitError) {
    throw new Error(clientInitError)
  }
  try {
    client = createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  } catch (err) {
    clientInitError =
      err instanceof Error
        ? err.message
        : 'Supabase client could not be initialized. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
    throw new Error(clientInitError)
  }
  return client
}

/** Singleton Supabase client (null if .env not set or init failed) */
export const supabase: SupabaseClient | null = (() => {
  if (!isSupabaseConfigured) return null
  try {
    return getClient()
  } catch {
    return null
  }
})()

export function requireSupabase(): SupabaseClient {
  return supabase ?? getClient()
}
