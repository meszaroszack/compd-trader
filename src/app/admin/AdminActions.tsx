"use client";

import { useState } from "react";

export function AdminActions({ remaining }: { remaining: number }) {
  const [loading, setLoading] = useState(false);
  const [newUrl, setNewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setError(null);
    setNewUrl(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/invite", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed");
        return;
      }
      setNewUrl(data.url ?? null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading || remaining <= 0}
        className="rounded bg-white text-zinc-900 px-4 py-2 text-sm font-medium hover:bg-zinc-100 disabled:opacity-50"
      >
        {loading ? "Creating…" : "Create invite link"}
      </button>
      {newUrl && (
        <div className="rounded border border-zinc-700 bg-zinc-900 p-3 text-sm">
          <p className="text-zinc-400 mb-1">New invite link (copy and send):</p>
          <code className="break-all text-emerald-400">{newUrl}</code>
        </div>
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
