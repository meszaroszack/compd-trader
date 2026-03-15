"use client";

import { useState } from "react";
import {
  saveBotConfig,
  type BotModelRow,
  type BotConfigRow,
  type BotConfigForm,
} from "./actions";
import { runBotCycle } from "./runCycle";

export function BotConfigCard({
  model,
  config,
  userId,
}: {
  model: BotModelRow;
  config: BotConfigRow | undefined;
  userId: string;
}) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [cycleResult, setCycleResult] = useState<{
    balance: number;
    marketCount: number;
    btcPrice: number;
    error?: string;
  } | null>(null);
  const [cycleLoading, setCycleLoading] = useState(false);
  const defaults: BotConfigForm = {
    modelId: model.id,
    enabled: config?.enabled ?? false,
    riskPercent: config?.riskPercent ?? 25,
    strategy: config?.strategy ?? "swing",
    profitTarget: config?.profitTarget ?? 25,
    stopLoss: config?.stopLoss ?? 20,
    minConfidence: config?.minConfidence ?? 60,
    targetBalance: config?.targetBalance ?? 100,
    pollInterval: config?.pollInterval ?? 5,
    swingThreshold: config?.swingThreshold ?? 0.05,
    swingLookback: config?.swingLookback ?? 3,
    endOfRoundHoldMins: config?.endOfRoundHoldMins ?? 4,
  };
  const [form, setForm] = useState<BotConfigForm>(defaults);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    const result = await saveBotConfig(userId, form);
    setSaving(false);
    if (result.ok) {
      setMessage({ type: "ok", text: "Config saved." });
    } else {
      setMessage({ type: "err", text: result.error ?? "Save failed." });
    }
  }

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
      <h3 className="font-semibold">{model.name}</h3>
      {model.description && (
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {model.description}
        </p>
      )}
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {message && (
          <p
            className={
              message.type === "ok"
                ? "text-sm text-emerald-600 dark:text-emerald-400"
                : "text-sm text-red-600 dark:text-red-400"
            }
          >
            {message.text}
          </p>
        )}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id={`enabled-${model.id}`}
            checked={form.enabled}
            onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
            className="rounded border-zinc-300 dark:border-zinc-600"
          />
          <label htmlFor={`enabled-${model.id}`} className="text-sm font-medium">
            Run this bot
          </label>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <LabelInput
            label="Risk %"
            type="number"
            min={1}
            max={100}
            step={1}
            value={form.riskPercent}
            onChange={(v) => setForm((f) => ({ ...f, riskPercent: v }))}
          />
          <LabelInput
            label="Profit target %"
            type="number"
            min={0}
            step={1}
            value={form.profitTarget}
            onChange={(v) => setForm((f) => ({ ...f, profitTarget: v }))}
          />
          <LabelInput
            label="Stop loss %"
            type="number"
            min={0}
            step={1}
            value={form.stopLoss}
            onChange={(v) => setForm((f) => ({ ...f, stopLoss: v }))}
          />
          <LabelInput
            label="Min confidence %"
            type="number"
            min={0}
            max={100}
            step={1}
            value={form.minConfidence}
            onChange={(v) => setForm((f) => ({ ...f, minConfidence: v }))}
          />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <LabelInput
            label="Target balance"
            type="number"
            min={0}
            step={1}
            value={form.targetBalance}
            onChange={(v) => setForm((f) => ({ ...f, targetBalance: v }))}
          />
          <LabelInput
            label="Poll interval (s)"
            type="number"
            min={1}
            value={form.pollInterval}
            onChange={(v) => setForm((f) => ({ ...f, pollInterval: v }))}
          />
          <LabelInput
            label="Swing threshold"
            type="number"
            min={0}
            step={0.01}
            value={form.swingThreshold}
            onChange={(v) => setForm((f) => ({ ...f, swingThreshold: v }))}
          />
          <LabelInput
            label="Swing lookback"
            type="number"
            min={1}
            value={form.swingLookback}
            onChange={(v) => setForm((f) => ({ ...f, swingLookback: v }))}
          />
        </div>
        <div className="flex gap-2">
          <LabelInput
            label="End-of-round hold (min)"
            type="number"
            min={0}
            step={0.5}
            value={form.endOfRoundHoldMins}
            onChange={(v) => setForm((f) => ({ ...f, endOfRoundHoldMins: v }))}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 py-2 px-4 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save config"}
          </button>
          <button
            type="button"
            disabled={cycleLoading}
            onClick={async () => {
              setCycleResult(null);
              setCycleLoading(true);
              const res = await runBotCycle(model.slug);
              setCycleLoading(false);
              if (res.error) setCycleResult({ balance: 0, marketCount: 0, btcPrice: 0, error: res.error });
              else setCycleResult({ balance: res.balance ?? 0, marketCount: res.marketCount ?? 0, btcPrice: res.btcPrice ?? 0 });
            }}
            className="rounded-md border border-zinc-300 dark:border-zinc-600 py-2 px-4 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50"
          >
            {cycleLoading ? "Running…" : "Run one cycle"}
          </button>
        </div>
        {cycleResult && (
          <div className="mt-3 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 p-3 text-sm">
            {cycleResult.error ? (
              <p className="text-red-600 dark:text-red-400">{cycleResult.error}</p>
            ) : (
              <p className="text-zinc-700 dark:text-zinc-300">
                Balance: ${cycleResult.balance.toFixed(2)} · Markets: {cycleResult.marketCount} · BTC: ${cycleResult.btcPrice.toFixed(0)}
              </p>
            )}
          </div>
        )}
      </form>
    </div>
  );
}

function LabelInput({
  label,
  type,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  type: "number";
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">
        {label}
      </label>
      <input
        type={type}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="mt-1 w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1.5 text-sm"
      />
    </div>
  );
}
