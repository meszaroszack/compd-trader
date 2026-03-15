-- RLS for invite_tokens and consents. Run after tables exist (after db:push or after 00003_schema_invites_consents.sql).
-- invite_tokens: no policy = no access via Supabase client (admin uses server/direct DB).
-- consents: users can read/insert own only.

ALTER TABLE invite_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE consents ENABLE ROW LEVEL SECURITY;

-- No policy on invite_tokens for authenticated/anon = no access via Supabase client.
-- Server (Drizzle with DATABASE_URL) uses postgres role and can manage tokens.

-- Consents: user can insert own, read own
CREATE POLICY "Users can insert own consents"
  ON consents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own consents"
  ON consents FOR SELECT
  USING (auth.uid() = user_id);
