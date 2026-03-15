"use server";

import { db } from "@/lib/db";
import { encryptCredentialSafe } from "@/lib/credential-encrypt";
import {
  botModels,
  botConfigs,
  kalshiCredentials,
} from "../../../shared/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type BotModelRow = typeof botModels.$inferSelect;
export type BotConfigRow = typeof botConfigs.$inferSelect;
export type KalshiCredsRow = typeof kalshiCredentials.$inferSelect;

export async function getBotModels(): Promise<BotModelRow[]> {
  return db.select().from(botModels).orderBy(botModels.name);
}

export async function getMyBotConfigs(userId: string): Promise<BotConfigRow[]> {
  return db
    .select()
    .from(botConfigs)
    .where(eq(botConfigs.userId, userId));
}

export async function getMyKalshiCredentials(
  userId: string
): Promise<(KalshiCredsRow & { masked: string }) | null> {
  const rows = await db
    .select()
    .from(kalshiCredentials)
    .where(eq(kalshiCredentials.userId, userId))
    .limit(1);
  const row = rows[0] ?? null;
  if (!row) return null;
  const id = row.apiKeyId ?? "";
  const masked =
    id.length > 4 ? `${id.slice(0, 2)}••••${id.slice(-2)}` : "••••";
  return { ...row, masked };
}

export type BotConfigForm = {
  modelId: string;
  enabled: boolean;
  riskPercent: number;
  strategy: string;
  profitTarget: number;
  stopLoss: number;
  minConfidence: number;
  targetBalance: number;
  pollInterval: number;
  swingThreshold: number;
  swingLookback: number;
  endOfRoundHoldMins: number;
};

export async function saveBotConfig(
  userId: string,
  form: BotConfigForm
): Promise<{ ok: boolean; error?: string }> {
  try {
    const existing = await db
      .select()
      .from(botConfigs)
      .where(
        and(
          eq(botConfigs.userId, userId),
          eq(botConfigs.modelId, form.modelId)
        )
      )
      .limit(1);
    const row = {
      userId,
      modelId: form.modelId,
      enabled: form.enabled,
      riskPercent: form.riskPercent,
      strategy: form.strategy,
      profitTarget: form.profitTarget,
      stopLoss: form.stopLoss,
      minConfidence: form.minConfidence,
      targetBalance: form.targetBalance,
      pollInterval: form.pollInterval,
      swingThreshold: form.swingThreshold,
      swingLookback: form.swingLookback,
      endOfRoundHoldMins: form.endOfRoundHoldMins,
      updatedAt: new Date(),
    };
    if (existing[0]) {
      await db
        .update(botConfigs)
        .set(row)
        .where(eq(botConfigs.id, existing[0].id));
    } else {
      await db.insert(botConfigs).values(row);
    }
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to save config",
    };
  }
}

export async function saveKalshiCredentials(
  userId: string,
  apiKeyId: string,
  privateKeyPem: string,
  environment: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const existing = await db
      .select()
      .from(kalshiCredentials)
      .where(eq(kalshiCredentials.userId, userId))
      .limit(1);
    const env = environment === "demo" ? "demo" : "production";
    if (existing[0]) {
      const api = apiKeyId.trim();
      const pem = privateKeyPem.trim();
    const row = {
      apiKeyId: api || existing[0].apiKeyId,
      privateKeyEncrypted: pem ? encryptCredentialSafe(pem) : existing[0].privateKeyEncrypted,
      environment: env,
      updatedAt: new Date(),
    };
      await db
        .update(kalshiCredentials)
        .set(row)
        .where(eq(kalshiCredentials.id, existing[0].id));
    } else {
      if (!apiKeyId.trim() || !privateKeyPem.trim()) {
        return { ok: false, error: "API Key ID and Private Key are required for first save." };
      }
      await db.insert(kalshiCredentials).values({
        userId,
        apiKeyId: apiKeyId.trim(),
        privateKeyEncrypted: encryptCredentialSafe(privateKeyPem.trim()),
        environment: env,
        updatedAt: new Date(),
      });
    }
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to save credentials",
    };
  }
}
