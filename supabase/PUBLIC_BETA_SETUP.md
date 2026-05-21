# ForFuture public beta — Supabase & deploy checklist

Run these steps **in order** in the Supabase SQL Editor for an existing project that already has core tables.

**Seeing “database needs an update” in the app?** The feed view is behind the app. Run **`fix_database.sql`** first (one paste, wait for Success), then continue with the table below. Hard-refresh the site (Ctrl+Shift+R).

## 1. SQL scripts (run in this order)

Open **Supabase Dashboard → SQL Editor → New query**. For each step: paste the file, click **Run**, wait for **Success**.

| Order | File | Purpose |
|-------|------|---------|
| 0 | **`fix_database.sql`** | **Use when the app shows “database needs an update”** — full schema + `posts_public_safe` repair |
| 1 | `fix_missing_features.sql` | Patches schema columns/views if your DB is behind the app (polls, trust view) |
| 2 | `content_reports.sql` | Reports table + admin RPCs (skip if already applied) |
| 3–5 | **`RUN_PUBLIC_BETA_IN_SUPABASE.sql`** | **One paste** — constraints + report types + RLS |
| 6 | **`fix_rls_performance_linter.sql`** | **Optional** — clears Supabase linter WARNs (RLS initplan, duplicate indexes) |

Or run steps 3–5 individually:

| Order | File |
|-------|------|
| 3 | `public_beta_constraints.sql` |
| 4 | `public_beta_content_reports.sql` |
| 5 | `public_beta_rls.sql` |

For a **brand-new** project, use `APPLY_ALL_MIGRATIONS.sql` instead of step 1, then run step 2 (if reports not included), then **`RUN_PUBLIC_BETA_IN_SUPABASE.sql`**.

## 2. Supabase Dashboard — Authentication

**Authentication → URL Configuration**

- **Site URL:** `https://YOUR-SITE.netlify.app` (or your custom domain)
- **Redirect URLs** (add both):
  - `http://localhost:5173/**`
  - `https://YOUR-SITE.netlify.app/**`

Password reset emails use `{origin}/reset-password`. Set **`VITE_APP_URL`** at build time on Netlify if you want a fixed redirect when the email is opened outside the browser.

**Authentication → Providers → Email**

- Enable email provider
- Optional: disable “Confirm email” for faster beta signup (or keep enabled and add a confirmation UX later)

## 3. Netlify environment variables

| Variable | Required |
|----------|----------|
| `VITE_SUPABASE_URL` | Yes |
| `VITE_SUPABASE_ANON_KEY` | Yes |
| `VITE_APP_URL` | Recommended (`https://your-site.netlify.app`) |
| `VITE_GOOGLE_MAPS_API_KEY` | Optional (maps) |

Never set `SUPABASE_SERVICE_ROLE_KEY` or `OPENAI_API_KEY` in Netlify — only in Supabase secrets for Edge Functions.

## 4. Netlify redirects

Ensure `public/_redirects` contains:

```
/*    /index.html   200
```

## 5. Platform admin (moderation)

After your account exists, run once in SQL Editor (replace email):

```sql
update public.profiles
set is_admin = true
where id = (select id from auth.users where email = 'your-admin@email.com');
```

Then open `/admin/moderation` while logged in.

## 6. Verify locally

```bash
npm run build
npm run test:run
```

Test: signup → login → logout → forgot password → reset link → report content → sign petition / vote poll twice (should show friendly duplicate message).
