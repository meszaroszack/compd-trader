import {
  pgTable,
  text,
  real,
  integer,
  timestamp,
  uuid,
  jsonb,
  boolean,
} from "drizzle-orm/pg-core";

/**
 * Profiles — linked to Supabase Auth (id matches auth.users.id).
 * Beta: invite_token_used, consent_given_at, tier, kalshi_env.
 */
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  inviteTokenUsed: text("invite_token_used"),
  consentGivenAt: timestamp("consent_given_at"),
  tier: text("tier").notNull().default("BETA_FREE"),
  kalshiEnv: text("kalshi_env").default("demo"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * Invite tokens — single-use, expiring (e.g. 7 days). Max 100 beta seats.
 */
export const inviteTokens = pgTable("invite_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  usedByUserId: uuid("used_by_user_id").references(() => profiles.id),
  createdAt: timestamp("created_at").defaultNow(),
});

/**
 * Consents — immutable record of data agreement (timestamp + IP + version).
 */
export const consents = pgTable("consents", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  consentedAt: timestamp("consented_at").defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  payload: jsonb("payload"),
});

/**
 * Bot models — which strategies/bots are available (e.g. Trader Retro, future variants).
 * One row per "model" that beta testers can run.
 */
export const botModels = pgTable("bot_models", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

/**
 * Bot configs — per-user, per-model settings (risk %, strategy, targets).
 * One config per (user, model); used when running that model.
 */
export const botConfigs = pgTable("bot_configs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  modelId: uuid("model_id").references(() => botModels.id, { onDelete: "cascade" }),
  enabled: boolean("enabled").notNull().default(false),
  riskPercent: real("risk_percent").notNull().default(25),
  strategy: text("strategy").notNull().default("swing"),
  profitTarget: real("profit_target").notNull().default(25),
  stopLoss: real("stop_loss").notNull().default(20),
  minConfidence: real("min_confidence").notNull().default(60),
  targetBalance: real("target_balance").notNull().default(100),
  pollInterval: integer("poll_interval").notNull().default(5),
  swingThreshold: real("swing_threshold").notNull().default(0.05),
  swingLookback: integer("swing_lookback").notNull().default(3),
  endOfRoundHoldMins: real("end_of_round_hold_mins").notNull().default(4),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * Kalshi API credentials — per user (same creds for all their bots).
 * privateKey is stored encrypted; decrypt server-side only.
 */
export const kalshiCredentials = pgTable("kalshi_credentials", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" })
    .unique(),
  apiKeyId: text("api_key_id").notNull(),
  privateKeyEncrypted: text("private_key_encrypted").notNull(),
  environment: text("environment").notNull().default("production"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * Bot runs — one row per "session" (user started model X at time T).
 * Links trade_events and trades to a run for per-run and cumulative analytics.
 */
export const botRuns = pgTable("bot_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  modelId: uuid("model_id")
    .notNull()
    .references(() => botModels.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("running"), // running | stopped | error
  startedAt: timestamp("started_at").defaultNow(),
  endedAt: timestamp("ended_at"),
  configSnapshot: jsonb("config_snapshot"),
});

/**
 * Trade events — telemetry (signals, errors, state). Tied to user + optional model/run.
 */
export const tradeEvents = pgTable("trade_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  modelId: uuid("model_id").references(() => botModels.id, { onDelete: "set null" }),
  runId: uuid("run_id").references(() => botRuns.id, { onDelete: "set null" }),
  eventType: text("event_type").notNull(),
  ticker: text("ticker"),
  side: text("side"),
  outcome: text("outcome"),
  errorMessage: text("error_message"),
  payload: jsonb("payload"),
  createdAt: timestamp("created_at").defaultNow(),
});

/**
 * Trades — executed orders for cumulative totals and per-model success.
 */
export const trades = pgTable("trades", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  modelId: uuid("model_id")
    .notNull()
    .references(() => botModels.id, { onDelete: "cascade" }),
  runId: uuid("run_id").references(() => botRuns.id, { onDelete: "set null" }),
  orderId: text("order_id"),
  ticker: text("ticker").notNull(),
  side: text("side").notNull(),
  action: text("action").notNull(),
  count: integer("count").notNull(),
  pricePerContract: real("price_per_contract").notNull(),
  totalCost: real("total_cost").notNull(),
  status: text("status").notNull().default("pending"),
  pnl: real("pnl"),
  signalReason: text("signal_reason"),
  btcPriceAtTrade: real("btc_price_at_trade"),
  marketTitle: text("market_title"),
  createdAt: timestamp("created_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

/**
 * Signals — per-model signal log (direction, confidence, indicators) for debugging.
 */
export const signals = pgTable("signals", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  modelId: uuid("model_id")
    .notNull()
    .references(() => botModels.id, { onDelete: "cascade" }),
  runId: uuid("run_id").references(() => botRuns.id, { onDelete: "set null" }),
  direction: text("direction").notNull(),
  confidence: real("confidence").notNull(),
  btcPrice: real("btc_price").notNull(),
  marketTicker: text("market_ticker"),
  marketYesPrice: real("market_yes_price"),
  rsi: real("rsi"),
  macd: real("macd"),
  macdSignal: real("macd_signal"),
  reasoning: text("reasoning"),
  traded: boolean("traded").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});
