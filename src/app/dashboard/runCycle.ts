"use client";

export type CycleResult = {
  balance?: number;
  marketCount?: number;
  btcPrice?: number;
  enabled?: boolean;
  modelSlug?: string;
  error?: string;
};

export async function runBotCycle(modelSlug: string): Promise<CycleResult> {
  const res = await fetch("/api/bot/cycle", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ modelSlug }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { error: data.error ?? "Request failed" };
  }
  return data;
}
