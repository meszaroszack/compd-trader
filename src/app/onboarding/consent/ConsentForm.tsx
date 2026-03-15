"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { recordConsent } from "./actions";

export function ConsentForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agree) return;
    setError(null);
    setLoading(true);
    const result = await recordConsent(
      userId,
      null,
      typeof navigator !== "undefined" ? navigator.userAgent : null
    );
    setLoading(false);
    if (result.ok) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setError(result.error ?? "Something went wrong.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={agree}
          onChange={(e) => setAgree(e.target.checked)}
          className="mt-1 rounded border-zinc-600 bg-zinc-800"
        />
        <span className="text-sm text-zinc-300">
          I agree to the collection and use of my trading behavior data as
          described above.
        </span>
      </label>
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
      <button
        type="submit"
        disabled={!agree || loading}
        className="rounded-md bg-white text-zinc-900 font-medium py-2 px-6 hover:bg-zinc-100 disabled:opacity-50"
      >
        {loading ? "Saving…" : "Continue to dashboard"}
      </button>
    </form>
  );
}
