# Supabase security notes (ForFuture)

## Frontend (Netlify / Vite)

- Only **`VITE_SUPABASE_URL`** and **`VITE_SUPABASE_ANON_KEY`** belong in the browser.
- Never put **`SUPABASE_SERVICE_ROLE_KEY`**, **`OPENAI_API_KEY`**, or other secrets in `VITE_*` variables.
- ActionPath AI must be called via **`supabase.functions.invoke('actionpath-ai')`** only (see `src/lib/actionPathAi.ts`).

## Row Level Security (RLS)

The app assumes RLS is enabled on user-owned tables. After schema changes, verify in the Supabase dashboard:

| Area | Policy expectation |
|------|-------------------|
| `posts` / `posts_public_safe` | Public read for published movements; insert/update/delete for owner |
| `post_actions`, poll votes, petition signatures | Authenticated users; no duplicate votes per user |
| `profiles` | Users read/update own profile |
| `movement_attachments` | Read via public post view; write for post owner |
| `content_reports` | Insert for members; read/update for admins only |

If a feature works locally with the service role but fails in production, missing RLS policies are the first place to check.

## Edge Functions

- **`actionpath-ai`**: OpenAI key lives in Supabase secrets, not in the React app.
- Set secrets: `supabase secrets set OPENAI_API_KEY=...`
- Deploy: `supabase functions deploy actionpath-ai`

## Auth redirect URLs

In **Authentication → URL Configuration**, add:

- `http://localhost:5173/**` (local)
- `https://YOUR-SITE.netlify.app/**` (production)

Optional: set `VITE_APP_URL` at build time for password-reset links.
