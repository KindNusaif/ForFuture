# ForFuture

ForFuture is a youth-centric civic engagement platform that helps young people turn social concerns into organized action. Users can raise issues, create movements, launch petitions, organize volunteer drives, run polls, and support meaningful community campaigns.

The web app is built with **React**, **Vite**, **TypeScript**, **Tailwind CSS**, and **Supabase**.

## How to use

1. **Sign up or log in** to the platform.
2. **Browse the feed** to explore posts, petitions, polls, and drives.
3. **Create a movement** by choosing the relevant category.
4. **Use ActionPath AI** to improve and organize your submission.
5. **Engage with others** by voting, signing petitions, joining drives, or supporting campaigns.
6. **Track your activity and impact** through your profile.

## Purpose

ForFuture empowers youth, students, volunteers, and civic-minded citizens to move beyond discussion and take meaningful action for society.

## Core features

- **Authentication** — sign up, login, logout, session persistence, protected routes
- **Youth Voice** — anonymous posting with Youth Voice ID
- **Movements feed** — browse, filter, search, support, and view full movement details
- **Petitions** — create, sign, and track support
- **Polls** — vote once per user with live results
- **Volunteer drives & civic actions** — event metadata and participation
- **Fundraising & relief hub** — donation / relief flows with trust review hooks
- **ActionPath AI** — Supabase Edge Function suggests titles, copy, and movement structure
- **Impact** — Youth Impact Pulse dashboard and impact map
- **Discover** — curated public hub for guests
- **Profiles** — user dashboard and movement management
- **i18n** — English, Sinhala, Tamil
- **Responsive UI** — smooth experience across desktop and mobile

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite 8, TypeScript, Tailwind CSS 4 |
| Routing | React Router 7 |
| Backend | Supabase (Postgres, Auth, Storage, Edge Functions) |
| Maps | Leaflet (impact map), optional Google Maps (location picker) |
| Tests | Vitest, React Testing Library |

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run [`supabase/APPLY_ALL_MIGRATIONS.sql`](supabase/APPLY_ALL_MIGRATIONS.sql) once.
3. Under **Authentication → Providers → Email**, disable **Confirm email** for faster local signup (optional).
4. Copy **Project URL** and **anon public** key.

See [`supabase/SECURITY_NOTES.md`](supabase/SECURITY_NOTES.md) for RLS and Edge Function guidance.

### 3. Environment variables

```bash
copy .env.example .env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anon (public) key |
| `VITE_APP_URL` | No | Production site URL for auth redirects |
| `VITE_GOOGLE_MAPS_API_KEY` | No | Map picker / static previews |

**Never** commit `.env` or put service-role / OpenAI keys in `VITE_*` variables.

### 4. Run locally

```bash
npm run dev
```

Open `http://localhost:5173`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build (`dist/`) |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |
| `npm test` | Vitest watch mode |
| `npm run test:run` | Vitest single run (CI) |

## Testing

```bash
npm run test:run
```

Tests cover URL filter helpers, auth form validation, and protected-route behavior.

## Netlify deployment

1. **Build command:** `npm run build`
2. **Publish directory:** `dist`
3. **Environment variables:** set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (and optional keys above).
4. **SPA routing:** `public/_redirects` contains:

   ```
   /* /index.html 200
   ```

5. In Supabase **Authentication → URL Configuration**, add your Netlify URL (e.g. `https://your-site.netlify.app/**`).

Redeploy after changing environment variables (Vite bakes them in at build time).

## Security

- The browser only uses the Supabase **anon** key; RLS enforces access control.
- **ActionPath AI** calls `supabase/functions/actionpath-ai` — the OpenAI API key must live in Supabase Edge Function secrets, not in this repo or frontend env vars.
- Review [`supabase/SECURITY_NOTES.md`](supabase/SECURITY_NOTES.md) after schema changes.

## Project structure (high level)

```
src/
  components/   # UI and feature components
  context/      # Auth, theme, modals
  hooks/        # Data loading and auth helpers
  lib/          # Supabase, posts, polls, validation, etc.
  pages/        # Route-level screens
  i18n/         # Translations
supabase/       # SQL migrations and Edge Functions
public/         # Static assets and Netlify _redirects
```

## License

Private / hackathon project — adjust as needed for your team.
