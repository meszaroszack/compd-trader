-- Migration 00004: Alpha-bot persistence layer
-- Run in Supabase SQL Editor (Project → SQL Editor → New query → paste → Run)
--
-- What this adds:
--   1. fee_dollars        — entry fee on the trades table (taker fee at order placement)
--   2. fee_dollars_exit   — exit fee (for future bracket-order tracking)
--   3. reconciled_pnl     — actual P&L sourced from Kalshi settled positions API
--   4. start_balance      — balance when the bot_run started
--   5. end_balance        — balance when the bot_run ended
--   6. total_pnl          — sum of all reconciled P&L for the run
--   7. total_fees         — sum of all fees paid during the run
--   8. trade_count        — number of trades placed during the run
--   9. bot_logs table     — granular event log (every tick, error, reconciliation)
--
-- All ALTER TABLE statements are idempotent (DO $$ IF NOT EXISTS $$ blocks).
-- Safe to run multiple times.

-- ── 1. trades: add fee and reconciliation columns ─────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'trades' AND column_name = 'fee_dollars'
  ) THEN
    ALTER TABLE public.trades ADD COLUMN fee_dollars real;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'trades' AND column_name = 'fee_dollars_exit'
  ) THEN
    ALTER TABLE public.trades ADD COLUMN fee_dollars_exit real;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'trades' AND column_name = 'reconciled_pnl'
  ) THEN
    -- reconciled_pnl = P&L sourced directly from Kalshi settled positions API.
    -- This is the source of truth. The pnl column may differ (estimated at exit).
    ALTER TABLE public.trades ADD COLUMN reconciled_pnl real;
  END IF;
END $$;

-- ── 2. bot_runs: add session accounting columns ───────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bot_runs' AND column_name = 'start_balance'
  ) THEN
    ALTER TABLE public.bot_runs ADD COLUMN start_balance real;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bot_runs' AND column_name = 'end_balance'
  ) THEN
    ALTER TABLE public.bot_runs ADD COLUMN end_balance real;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bot_runs' AND column_name = 'total_pnl'
  ) THEN
    ALTER TABLE public.bot_runs ADD COLUMN total_pnl real;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bot_runs' AND column_name = 'total_fees'
  ) THEN
    ALTER TABLE public.bot_runs ADD COLUMN total_fees real;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bot_runs' AND column_name = 'trade_count'
  ) THEN
    ALTER TABLE public.bot_runs ADD COLUMN trade_count integer;
  END IF;
END $$;

-- ── 3. bot_logs table ─────────────────────────────────────────────────────────
-- Granular event stream: price ticks, order attempts, reconciliation events,
-- errors. Too noisy for the trades/signals tables, but invaluable for debugging.
CREATE TABLE IF NOT EXISTS public.bot_logs (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        REFERENCES public.profiles(id) ON DELETE CASCADE,
  model_id   uuid        REFERENCES public.bot_models(id) ON DELETE SET NULL,
  run_id     uuid        REFERENCES public.bot_runs(id) ON DELETE SET NULL,
  level      text        NOT NULL,      -- 'info' | 'warn' | 'error' | 'trade' | 'signal' | 'reconcile'
  message    text        NOT NULL,
  payload    jsonb,                     -- arbitrary structured context
  created_at timestamptz DEFAULT now()
);

-- Index for fast per-run and per-level queries
CREATE INDEX IF NOT EXISTS bot_logs_run_id_idx
  ON public.bot_logs (run_id, created_at DESC);

CREATE INDEX IF NOT EXISTS bot_logs_user_level_idx
  ON public.bot_logs (user_id, level, created_at DESC);

-- RLS: users can only read their own logs; service role can insert freely
ALTER TABLE public.bot_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own bot_logs"
  ON public.bot_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Service role bypasses RLS — no INSERT policy needed for the bot.
-- If you ever want anon/authenticated clients to insert (future use), add:
-- CREATE POLICY "Users can insert own bot_logs"
--   ON public.bot_logs FOR INSERT
--   WITH CHECK (auth.uid() = user_id);

-- ── 4. Seed alpha-bot model (if not already present) ─────────────────────────
-- alpha-bot is a new model separate from "Trader Retro".
-- If you want to track it separately in bot_models, insert here.
-- (Optional — you can reuse the existing Trader Retro model ID instead.)
INSERT INTO public.bot_models (id, name, slug, description)
VALUES (
  'b1111111-0000-4000-8000-000000000002'::uuid,
  'Alpha Bot',
  'alpha-bot',
  'Alpha Bot v2 — RSI/MACD momentum + Bollinger scalper, direct Railway deploy.'
)
ON CONFLICT (slug) DO NOTHING;
