"use client";

import { useState } from "react";
import { saveKalshiCredentials } from "./actions";

export function KalshiCredentialsForm({
  userId,
  hasStoredCreds,
  masked,
}: {
  userId: string;
  hasStoredCreds: boolean;
  masked: string;
}) {
  const [apiKeyId, setApiKeyId] = useState("");
  const [privateKeyPem, setPrivateKeyPem] = useState("");
  const [environment, setEnvironment] = useState<"demo" | "production">("demo");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!apiKeyId.trim() || !privateKeyPem.trim()) {
      setMessage({ type: "err", text: "API Key ID and Private Key are required." });
      return;
    }
    setSaving(true);
    const result = await saveKalshiCredentials(
      userId,
      apiKeyId.trim(),
      privateKeyPem.trim(),
      environment
    );
    setSaving(false);
    if (result.ok) {
      setMessage({ type: "ok", text: "Credentials saved. You can run bots that use Kalshi." });
      setApiKeyId("");
      setPrivateKeyPem("");
    } else {
      setMessage({ type: "err", text: result.error ?? "Save failed." });
    }
  }

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
      <h2 className="font-semibold">Kalshi API</h2>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        One set of credentials per account. Used by all your bots. Use demo keys for testing.
      </p>
      {hasStoredCreds && (
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Stored key: <span className="font-mono">{masked}</span>
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
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            API Key ID
          </label>
          <input
            type="text"
            value={apiKeyId}
            onChange={(e) => setApiKeyId(e.target.value)}
            placeholder={hasStoredCreds ? "Leave blank to keep current" : "From Kalshi API settings"}
            className="mt-1 w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Private key (PEM)
          </label>
          <textarea
            value={privateKeyPem}
            onChange={(e) => setPrivateKeyPem(e.target.value)}
            placeholder={hasStoredCreds ? "Leave blank to keep current" : "-----BEGIN PRIVATE KEY-----..."}
            rows={4}
            className="mt-1 w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm font-mono"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Environment
          </label>
          <select
            value={environment}
            onChange={(e) => setEnvironment(e.target.value as "demo" | "production")}
            className="mt-1 w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
          >
            <option value="demo">Demo</option>
            <option value="production">Production</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 py-2 px-4 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save credentials"}
        </button>
      </form>
    </div>
  );
}
