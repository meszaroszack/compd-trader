"use server";

import { headers } from "next/headers";
import { db } from "@/lib/db";
import { consents, profiles } from "../../../../shared/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const CONSENT_VERSION = 1;

export async function recordConsent(
  userId: string,
  _ipPlaceholder?: string | null,
  userAgent?: string | null
): Promise<{ ok: boolean; error?: string }> {
  const h = await headers();
  const ipAddress =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip")?.trim() ||
    null;
  try {
    await db.insert(consents).values({
      userId,
      version: CONSENT_VERSION,
      ipAddress,
      userAgent: userAgent ?? null,
      payload: {
        text: "I agree to the collection and use of my trading behavior data (signals, strategy telemetry, market timing) to train COMP'D's proprietary AI models. Data is used internally only and not sold to third parties.",
      },
    });
    await db
      .update(profiles)
      .set({ consentGivenAt: new Date(), updatedAt: new Date() })
      .where(eq(profiles.id, userId));
    revalidatePath("/dashboard");
    revalidatePath("/onboarding/consent");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to record consent",
    };
  }
}
