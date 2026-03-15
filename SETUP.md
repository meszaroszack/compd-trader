# COMP'D setup: login, accounts, database

## 1. Environment

- Copy `.env.local.example` to `.env.local` and set:
  - `NEXT_PUBLIC_SUPABASE_URL` — from Supabase → Settings → API (or `https://<project-id>.supabase.co`)
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon/public key from same page
  - `DATABASE_URL` — from Settings → Database → Connection string (URI), replace `[YOUR-PASSWORD]` with your DB password

## 2. Database tables (Drizzle)

From the project root:

```bash
npm run db:push
```

This creates `profiles`, `bot_configs`, and `trade_events` in your Supabase Postgres.

## 3. RLS and profile trigger (Supabase SQL)

In Supabase Dashboard → **SQL Editor**, run the contents of:

**`supabase/migrations/00001_profiles_rls.sql`**

Then run **`supabase/migrations/00002_models_and_rls.sql`** (seeds bot_models with Trader Retro and RLS for new tables).

Then run **`supabase/migrations/00003_invites_consents.sql`** (RLS for invite_tokens and consents).

That file:

- Enables Row Level Security on `profiles`, `bot_configs`, `trade_events`
- Adds policies so each user only sees/edits their own rows
- Creates a trigger so a `profiles` row is created when someone signs up (and backfills existing users)

## 4. Supabase Auth

In Supabase Dashboard → **Authentication** → **Providers**:

- Enable **Email** (and optionally **Confirm email** if you want verification).
- No need to touch the alpha app (trader-retro); this is only for COMP'D.

## 5. Run the app

```bash
npm run dev
```

- **/** — Landing; “Sign in” / “Sign up” when logged out, “Go to dashboard” when logged in.
- **/login** — Sign in with email/password.
- **/signup** — Create account; confirm email if that option is on.
- **/dashboard** — Protected; shows account info and sign out.

Trader-retro (alpha) is unchanged; bot logic and Kalshi integration will be brought into this project later.
