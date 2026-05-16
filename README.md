# ForFuture

A web app where young people post initiatives for country development. Others explore, support, and filter by category.

## Quick start

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Set up Supabase**

   - Create a free project at [supabase.com](https://supabase.com)
   - In **SQL Editor**, run **[`supabase/APPLY_ALL_MIGRATIONS.sql`](supabase/APPLY_ALL_MIGRATIONS.sql)** once (full schema + trust + relief + attachments + impact pulse + appearance)
   - **New empty project?** [`supabase/00_fix_all.sql`](supabase/00_fix_all.sql) is an alternative core bootstrap
   - **Already have a database?** [`supabase/fix_missing_features.sql`](supabase/fix_missing_features.sql) patches polls + trust columns only
   - If the feed breaks after a migration, run [`supabase/recover_posts_api.sql`](supabase/recover_posts_api.sql) then `fix_missing_features.sql`
   - Under **Authentication → Providers → Email**, disable **Confirm email** for faster hackathon signup
   - Copy **Project URL** and **anon** / **publishable** key

3. **Environment variables**

   ```bash
   copy .env.example .env
   ```

   Fill in:

   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Run locally**

   ```bash
   npm run dev
   ```

   Open the URL shown (usually `http://localhost:5173`).

## Demo flow

**Guest (no account):**
1. Landing → **Explore Youth Momentum**
2. Browse / filter / search posts
3. Tap Support or Share → **Join the Movement** modal

**Member (logged in):**
1. **Join ForFuture** → sign up
2. Feed → filter → support a post
3. Create → publish an initiative
4. Profile → your posts and total support

## Scripts

| Command        | Description          |
|----------------|----------------------|
| `npm run dev`  | Start dev server     |
| `npm run build`| Production build     |
| `npm run preview` | Preview production build |

## Phase 2 (later)

Native mobile app (Expo) will use the same Supabase project for sync.
