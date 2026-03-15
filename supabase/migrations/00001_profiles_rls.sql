-- Run this in Supabase SQL Editor after tables exist (npm run db:push).
-- 1) Create profile when a new user signs up (auth.users).
-- 2) RLS so each user only sees their own data.

-- Enable RLS on public tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_events ENABLE ROW LEVEL SECURITY;

-- Policies: users can read/update their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policies: users can CRUD their own bot_configs
CREATE POLICY "Users can manage own bot_configs"
  ON bot_configs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies: users can insert/read their own trade_events (no delete/update needed)
CREATE POLICY "Users can insert own trade_events"
  ON trade_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own trade_events"
  ON trade_events FOR SELECT
  USING (auth.uid() = user_id);

-- Trigger: create profile row when auth.users gets a new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill: create profiles for any existing auth users who don't have one yet
INSERT INTO public.profiles (id, display_name)
SELECT id, COALESCE(raw_user_meta_data->>'display_name', split_part(email, '@', 1))
FROM auth.users
ON CONFLICT (id) DO NOTHING;
