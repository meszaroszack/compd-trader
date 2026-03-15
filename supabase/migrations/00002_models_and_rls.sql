-- Run after db:push (so bot_models, kalshi_credentials, bot_runs, trades, signals exist).
-- Seeds bot_models, backfills bot_configs.model_id, enables RLS on new tables.

-- Seed bot_models (Trader Retro = first model beta testers get)
INSERT INTO public.bot_models (id, name, slug, description)
VALUES (
  'a0000000-0000-4000-8000-000000000001'::uuid,
  'Trader Retro',
  'trader-retro',
  'KXBTC15M swing strategy (RSI/MACD). First beta model.'
)
ON CONFLICT (slug) DO NOTHING;

-- Backfill: assign existing bot_configs to Trader Retro if model_id is null
UPDATE public.bot_configs
SET model_id = (SELECT id FROM public.bot_models WHERE slug = 'trader-retro' LIMIT 1)
WHERE model_id IS NULL;

-- One config per user per model
CREATE UNIQUE INDEX IF NOT EXISTS bot_configs_user_model_idx
  ON public.bot_configs (user_id, model_id)
  WHERE model_id IS NOT NULL;

-- RLS: bot_models — everyone authenticated can read (no user_id)
ALTER TABLE bot_models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read bot_models"
  ON bot_models FOR SELECT
  TO authenticated
  USING (true);

-- RLS: kalshi_credentials — user can only see/update own
ALTER TABLE kalshi_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own kalshi_credentials"
  ON kalshi_credentials FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS: bot_runs — user can only see own
ALTER TABLE bot_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own bot_runs"
  ON bot_runs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS: trades — user can only see own
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own trades"
  ON trades FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own trades"
  ON trades FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own trades"
  ON trades FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS: signals — user can only see own
ALTER TABLE signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own signals"
  ON signals FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS: trade_events — allow model_id/run_id (policies already scoped by user_id)
-- No change needed; existing policies use user_id.

-- Allow insert/select on trade_events with model_id and run_id (already have user_id check)
-- Existing policies cover this.
