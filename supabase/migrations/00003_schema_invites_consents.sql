-- Run this in Supabase SQL Editor if db:push fails (drizzle-kit bug with CHECK constraints).
-- Adds beta columns to profiles and creates invite_tokens + consents.

-- 1) Add columns to profiles (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'invite_token_used') THEN
    ALTER TABLE public.profiles ADD COLUMN invite_token_used text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'consent_given_at') THEN
    ALTER TABLE public.profiles ADD COLUMN consent_given_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'tier') THEN
    ALTER TABLE public.profiles ADD COLUMN tier text NOT NULL DEFAULT 'BETA_FREE';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'kalshi_env') THEN
    ALTER TABLE public.profiles ADD COLUMN kalshi_env text DEFAULT 'demo';
  END IF;
END $$;

-- 2) Create invite_tokens
CREATE TABLE IF NOT EXISTS public.invite_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  used_by_user_id uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now()
);

-- 3) Create consents
CREATE TABLE IF NOT EXISTS public.consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  version integer NOT NULL,
  consented_at timestamptz DEFAULT now(),
  ip_address text,
  user_agent text,
  payload jsonb
);
