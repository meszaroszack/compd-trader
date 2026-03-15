# COMP'D Beta — Deploy to Railway (or similar)

Get the app live on a single URL for the 100-tester trial. Alpha (trader-retro) is unchanged.

## 1. Prerequisites

- Supabase project (COMP'D) with schema pushed and migrations run (00001, 00002, 00003).
- Domain optional: use Railway’s default URL (e.g. `compd-production.up.railway.app`) or a custom domain (e.g. `app.compd.trade`).

## 2. Railway setup

1. Go to [railway.app](https://railway.app) and sign in.
2. **New project** → **Deploy from GitHub repo** (connect `meszaroszack/compd-trader` or your COMP'D repo).
3. Root directory: project root (where `package.json` and `next.config.*` are).
4. Build: Railway will use `railway.json` (`npm run build`). Start: `npm start`.

## 3. Environment variables (Railway dashboard)

Set these in the Railway service → **Variables**:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `DATABASE_URL` | Supabase DB connection string (URI) |
| `CREDENTIAL_ENCRYPTION_KEY` | Min 32 chars; used to encrypt Kalshi private keys at rest |
| `NEXT_PUBLIC_APP_URL` | Public app URL (e.g. `https://your-app.up.railway.app` or `https://app.compd.trade`) — used for invite links |
| `ADMIN_USERNAME` | Admin panel Basic Auth username |
| `ADMIN_PASSWORD` | Admin panel Basic Auth password |

Optional for local dev: leave `CREDENTIAL_ENCRYPTION_KEY`, `ADMIN_*`, or `NEXT_PUBLIC_APP_URL` unset; invite links will use the deployed URL if you set it.

---

### How to set the three production-only variables

**Where:** Railway project → your COMP'D service → **Variables** tab (or **Settings** → **Variables**). Click **New variable** (or **Add variable**) for each.

---

**1. CREDENTIAL_ENCRYPTION_KEY (min 32 characters)**

- **What it’s for:** Encrypts users’ Kalshi private keys in the database. Must be at least 32 characters; keep it secret.
- **How to create a value:**
  - **Option A:** Open [https://www.random.org/strings](https://www.random.org/strings) and generate one string, 32–64 characters (alphanumeric), and paste it as the value.
  - **Option B:** In a terminal run (PowerShell):  
    `-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})`  
    Copy the output and use it as the value.
- **In Railway:** Name = `CREDENTIAL_ENCRYPTION_KEY`, Value = that long string (no quotes). Save.
- **Important:** If you change this later, existing stored keys can’t be decrypted. Set it once and keep it the same (e.g. store it in a password manager).

---

**2. NEXT_PUBLIC_APP_URL**

- **What it’s for:** Base URL of your live app. Used when generating invite links (e.g. `https://your-app.up.railway.app/invite/xyz`).
- **What to set:**
  - If you’re using Railway’s default domain: open your service in Railway → **Settings** → **Domains**. You’ll see something like `compd-production.up.railway.app`. Use:  
    `https://compd-production.up.railway.app`  
    (use your actual domain; no slash at the end.)
  - If you added a custom domain (e.g. `app.compd.trade`): use  
    `https://app.compd.trade`
- **In Railway:** Name = `NEXT_PUBLIC_APP_URL`, Value = that URL. Save.
- **Note:** After changing this, trigger a new deploy (e.g. **Redeploy** in Railway) so the app picks up the new value.

---

**3. ADMIN_USERNAME and ADMIN_PASSWORD**

- **What they’re for:** HTTP Basic Auth for `/admin` (and `/api/admin`). Only you (or people you give these to) can open the admin panel and create invite links.
- **What to set:**
  - **ADMIN_USERNAME:** Any username you’ll remember (e.g. `admin`, or your name). No spaces.
  - **ADMIN_PASSWORD:** A strong password (e.g. 16+ characters). Use a password manager to generate one and store it.
- **In Railway:** Add two variables:  
  - Name = `ADMIN_USERNAME`, Value = your chosen username.  
  - Name = `ADMIN_PASSWORD`, Value = your chosen password.  
  Save both.
- **Using the admin panel:** Go to `https://your-app.up.railway.app/admin`. The browser will ask for username and password; enter the same values you set here.

## 4. Deploy

- Push to the connected branch; Railway builds and deploys.
- Or use **Deploy** in the dashboard.

## 5. After first deploy

1. **Invite links**  
   Open `https://your-app.up.railway.app/admin` (use `ADMIN_USERNAME` / `ADMIN_PASSWORD`). Create invite links and share with testers.

2. **App URL for invites**  
   Set `NEXT_PUBLIC_APP_URL` to your live URL so new invite links use it (e.g. `https://compd-production.up.railway.app`). Redeploy if you change it.

3. **Database migrations**  
   Migrations (00001–00003) are run manually in Supabase SQL Editor. No need to run them from Railway.

## 6. Custom domain (optional)

- In Railway: **Settings** → **Domains** → add domain (e.g. `app.compd.trade`).
- In your DNS: add the CNAME record Railway shows.
- Set `NEXT_PUBLIC_APP_URL` to `https://app.compd.trade` and redeploy.

## 7. Cap and security

- **100 testers:** Enforced by invite tokens and `invite_token_used` on profiles; remaining seats shown on invite page and in admin.
- **Kalshi credentials:** Each user enters their own in Dashboard; stored encrypted (AES-256-GCM) when `CREDENTIAL_ENCRYPTION_KEY` is set.
- **Alpha:** No code or config from trader-retro is modified; COMP'D is a separate app and repo.
