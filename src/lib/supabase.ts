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

let client: SupabaseClient | null = null

function getClient(): SupabaseClient {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.',
    )
  }
  if (!client) {
    client = createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  }
  return client
}

/** Singleton Supabase client (null if .env not set) */
export const supabase: SupabaseClient | null = isSupabaseConfigured ? getClient() : null

export function requireSupabase(): SupabaseClient {
  return supabase ?? getClient()
}
