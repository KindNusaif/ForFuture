# ForFuture


ForFuture is a youth-centric civic engagement platform that helps young people turn social concerns into organized action. Users can raise issues, create movements, launch petitions, organize volunteer drives, run polls, and support meaningful community campaigns.

## Features

- **Youth Voice Posts**– Share community issues and social concerns.
- **Petitions** – Create and support causes that matter.
- **Volunteer Drives** – Organize and join real-world initiatives.
- **Polls** – Gather public opinions quickly.
- **Fundraising Campaigns** – Highlight trusted support needs.
- **ActionPath AI** – Helps structure rough ideas into clear, action-ready submissions.
- **Youth Voice ID** – Enables safer anonymous expression.
- **Responsive UI** – Smooth experience across desktop and mobile.

## How to Use

1. **Sign up or log in** to the platform.
2. **Browse the feed** to explore posts, petitions, polls, and drives.
3. **Create a movement** by choosing the relevant category.
4. **Use ActionPath AI** to improve and organize your submission.
5. **Engage with others** by voting, signing petitions, joining drives, or supporting campaigns.
6. **Track your activity and impact** through your profile.

## Purpose

ForFuture empowers youth, students, volunteers, and civic-minded citizens to move beyond discussion and take meaningful action for society.

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
