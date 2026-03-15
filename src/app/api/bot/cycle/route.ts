import { createClient } from "@/lib/supabaseServer";
import { db } from "@/lib/db";
import { decryptCredentialSafe } from "@/lib/credential-encrypt";
import { kalshiCredentials, botConfigs, botModels, tradeEvents } from "../../../../../shared/schema";
import { eq } from "drizzle-orm";
import { getBalance, getBtc15mMarkets, getBtcPrice } from "@/lib/kalshi";
import { NextResponse } from "next/server";

/**
 * POST /api/bot/cycle — run one bot cycle for the authenticated user.
 * Loads creds + config for the given model (e.g. trader-retro), fetches
 * balance/markets, records a cycle event, and returns state.
 * Full trading logic (signals, orders) will be added in a follow-up.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const modelSlug = (body.modelSlug as string) || "trader-retro";

  const [modelRows, credRows, configRows] = await Promise.all([
    db.select().from(botModels).where(eq(botModels.slug, modelSlug)).limit(1),
    db
      .select()
      .from(kalshiCredentials)
      .where(eq(kalshiCredentials.userId, user.id))
      .limit(1),
    db
      .select()
      .from(botConfigs)
      .where(eq(botConfigs.userId, user.id))
      .limit(20),
  ]);

  const model = modelRows[0];
  if (!model) {
    return NextResponse.json(
      { error: "Model not found", modelSlug },
      { status: 404 }
    );
  }

  const config = configRows.find((c) => c.modelId === model.id);
  const enabled = config?.enabled ?? false;
  const creds = credRows[0];
  if (!creds) {
    return NextResponse.json(
      { error: "No Kalshi credentials. Save them in Dashboard." },
      { status: 400 }
    );
  }

  const env = creds.environment === "demo" ? "demo" : "production";
  let balance = 0;
  let marketCount = 0;
  let btcPrice = 0;
  let error: string | null = null;

  const privateKeyPem = decryptCredentialSafe(creds.privateKeyEncrypted);
  try {
    [balance, marketCount, btcPrice] = await Promise.all([
      getBalance(creds.apiKeyId, privateKeyPem, env),
      getBtc15mMarkets(env).then((m) => m.length),
      getBtcPrice(),
    ]);
  } catch (e) {
    // privateKeyPem is not logged
    error = e instanceof Error ? e.message : "Kalshi/price fetch failed";
  }

  await db.insert(tradeEvents).values({
    userId: user.id,
    modelId: model.id,
    eventType: "cycle",
    payload: {
      balance,
      marketCount,
      btcPrice,
      enabled,
      error: error ?? undefined,
    },
  });

  if (error) {
    return NextResponse.json(
      { error, balance: 0, marketCount: 0, btcPrice: 0, enabled },
      { status: 200 }
    );
  }

  return NextResponse.json({
    balance,
    marketCount,
    btcPrice,
    enabled,
    modelSlug,
  });
}
