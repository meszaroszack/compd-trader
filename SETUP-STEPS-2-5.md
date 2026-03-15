# COMP'D setup: steps 2–5 (elementary instructions)

Do these in order. You need `.env.local` filled in first (Step 1 in SETUP.md).

---

## Step 2: Create the database tables

**What you’re doing:** Creating the `profiles`, `bot_configs`, and `trade_events` tables in your Supabase database using Drizzle.

**Where:** On your computer, in the COMP'D project folder.

1. Open a terminal (PowerShell or the one in Cursor).
2. Go to the COMP'D project folder. For example:
   ```powershell
   cd C:\Users\User\Downloads\compd
   ```
   (If your `compd` folder is somewhere else, use that path.)
3. Run:
   ```powershell
   npm run db:push
   ```
4. You should see output that includes something like “Pushing schema…” and then that it’s done. If it says `DATABASE_URL` is missing, add `DATABASE_URL` to `.env.local` (from Supabase → Settings → Database → Connection string) and try again.

**Done when:** The command finishes without errors. The tables now exist in your Supabase project.

**If `npm run db:push` fails** (e.g. with a `TypeError` about "replace" or "CHECK"): Drizzle Kit can hit a bug when reading existing constraints. Use the manual SQL path instead:

1. In Supabase Dashboard → **SQL Editor** → **New query**.
2. Run the contents of **`supabase/migrations/00003_schema_invites_consents.sql`** (adds beta columns to `profiles` and creates `invite_tokens` and `consents`).
3. Then continue with Step 3 below.

---

## Step 3: Turn on RLS and the profile trigger (Supabase SQL)

**What you’re doing:** Telling Supabase that each user may only see their own data (RLS) and that a profile row is created automatically when someone signs up.

**Where:** In the Supabase website, in your project.

1. Go to [https://supabase.com](https://supabase.com) and sign in.
2. Open your COMP'D project (click it in the list).
3. In the left sidebar, click **SQL Editor**.
4. Click **New query** (or the plus to create a new query).
5. Open this file on your computer in a text editor:
   ```
   C:\Users\User\Downloads\compd\supabase\migrations\00001_profiles_rls.sql
   ```
6. Select **all** the text in that file (Ctrl+A) and copy it (Ctrl+C).
7. Paste it into the Supabase SQL Editor box (the big text area).
8. Click **Run** (or press Ctrl+Enter).
9. At the bottom you should see something like “Success. No rows returned.” That’s normal.

**Done when:** The query runs with no red error message. If you get an error like “relation profiles does not exist”, go back to Step 2 and run `npm run db:push` again, then retry this step.

---

## Step 4: Enable Email sign-in (Supabase Auth)

**What you’re doing:** Allowing people to sign up and sign in with email and password.

**Where:** In the same Supabase project, Auth settings.

1. Stay in [supabase.com](https://supabase.com) with your COMP'D project open.
2. In the left sidebar, click **Authentication** (person icon).
3. Click **Providers** (under “Configuration” or in the Auth submenu).
4. Find **Email** in the list.
5. Turn **Email** on (enable it) if it isn’t already.
6. (Optional) If you want users to confirm their email before signing in:
   - Open **Email Templates** or the **Auth** settings where “Confirm email” is mentioned.
   - Enable **Confirm email** so Supabase sends a confirmation link.  
   If you leave this off, users can sign in right after signup without confirming.

**Done when:** Email provider is enabled. You don’t need to change any other providers (e.g. Google) unless you want them.

---

## Step 5: Run the app and try login

**What you’re doing:** Starting the COMP'D app on your machine and opening it in the browser.

1. Open a terminal and go to the COMP'D folder again:
   ```powershell
   cd C:\Users\User\Downloads\compd
   ```
2. Run:
   ```powershell
   npm run dev
   ```
3. You should see something like “Ready on http://localhost:3000”.
4. Open your browser and go to: **http://localhost:3000**
5. You should see the COMP'D landing page with **Sign in** and **Sign up**.
6. Click **Sign up**, enter an email and password (and optional display name), and click **Sign up**.
7. If you did **not** enable “Confirm email” in Step 4: click **Sign in** and sign in with that email and password, then you should be taken to the **Dashboard**.
8. If you **did** enable “Confirm email”: check that email for a link from Supabase, click it, then go back to http://localhost:3000 and click **Sign in** and sign in; you should then see the Dashboard.

**Done when:** You can open http://localhost:3000, sign up (and confirm email if you turned that on), sign in, and see the Dashboard. To stop the app, press Ctrl+C in the terminal.

---

## Quick checklist

- [ ] **Step 2:** Ran `npm run db:push` in `C:\Users\User\Downloads\compd` with no errors.
- [ ] **Step 3:** In Supabase → SQL Editor, pasted and ran the full contents of `supabase/migrations/00001_profiles_rls.sql`; run succeeded.
- [ ] **Step 4:** In Supabase → Authentication → Providers, Email is enabled.
- [ ] **Step 5:** Ran `npm run dev`, opened http://localhost:3000, signed up and signed in, and reached the Dashboard.
