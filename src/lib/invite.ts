import { db } from "@/lib/db";
import { inviteTokens, profiles } from "../../shared/schema";
import { eq, isNotNull, sql } from "drizzle-orm";

const BETA_SEAT_CAP = 100;
const INVITE_EXPIRY_DAYS = 7;

export type InviteStatus =
  | { valid: true; remainingSeats: number }
  | { valid: false; reason: string };

export async function validateInviteToken(token: string): Promise<InviteStatus> {
  const remaining = await getRemainingSeats();
  if (remaining <= 0) {
    return { valid: false, reason: "Beta is full." };
  }
  const rows = await db
    .select()
    .from(inviteTokens)
    .where(eq(inviteTokens.token, token))
    .limit(1);
  const row = rows[0];
  if (!row) {
    return { valid: false, reason: "Invalid invite link." };
  }
  if (row.usedAt != null) {
    return { valid: false, reason: "This invite has already been used." };
  }
  if (new Date(row.expiresAt) < new Date()) {
    return { valid: false, reason: "This invite has expired." };
  }
  return { valid: true, remainingSeats: remaining };
}

export async function consumeInviteToken(
  token: string,
  userId: string
): Promise<{ ok: boolean; error?: string }> {
  const status = await validateInviteToken(token);
  if (!status.valid) {
    return { ok: false, error: status.reason };
  }
  const rows = await db
    .select()
    .from(inviteTokens)
    .where(eq(inviteTokens.token, token))
    .limit(1);
  const row = rows[0];
  if (!row || row.usedAt != null) {
    return { ok: false, error: "Invite already used or invalid." };
  }
  await db
    .update(inviteTokens)
    .set({
      usedAt: new Date(),
      usedByUserId: userId,
    })
    .where(eq(inviteTokens.id, row.id));
  await db
    .update(profiles)
    .set({ inviteTokenUsed: token, updatedAt: new Date() })
    .where(eq(profiles.id, userId));
  return { ok: true };
}

export async function getRemainingSeats(): Promise<number> {
  const used = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(profiles)
    .where(isNotNull(profiles.inviteTokenUsed));
  const n = Number(used[0]?.count ?? 0);
  return Math.max(0, BETA_SEAT_CAP - n);
}

export async function createInviteToken(): Promise<{ token: string; url: string } | null> {
  const remaining = await getRemainingSeats();
  if (remaining <= 0) return null;
  const token = crypto.randomUUID().replace(/-/g, "").slice(0, 32);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);
  await db.insert(inviteTokens).values({
    token,
    expiresAt,
  });
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.compd.trade";
  return {
    token,
    url: `${base}/invite/${token}`,
  };
}
