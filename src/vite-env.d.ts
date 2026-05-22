/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  /** Optional — production site URL for Supabase Auth redirects (e.g. https://forfuture.app) */
  readonly VITE_APP_URL?: string
  /** Set to `false` to hide the prototype demo showcase on /how-it-works */
  readonly VITE_SHOW_DEMO_EXAMPLES?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
