"use client";

import { createClient } from "@/lib/supabaseClient";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

const INVITE_COOKIE = "compd_invite_token";

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [inviteValid, setInviteValid] = useState<boolean | null>(null);

  useEffect(() => {
    if (!inviteToken) {
      router.replace("/");
      return;
    }
    fetch(`/api/invite/validate?token=${encodeURIComponent(inviteToken)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.valid) {
          setInviteValid(true);
          document.cookie = `${INVITE_COOKIE}=${inviteToken}; path=/; max-age=3600; samesite=lax`;
        } else {
          setInviteValid(false);
          router.replace("/");
        }
      })
      .catch(() => setInviteValid(false));
  }, [inviteToken, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteToken || !inviteValid) return;
    setError(null);
    setMessage(null);
    setLoading(true);
    const supabase = createClient();
    const redirectUrl = `${window.location.origin}/auth/callback?invite=${encodeURIComponent(inviteToken)}`;
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName || undefined },
        emailRedirectTo: redirectUrl,
      },
    });
    setLoading(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    setMessage(
      "Check your email to confirm your account, then sign in below."
    );
  }

  if (inviteValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
        <p className="text-zinc-500">Checking invite…</p>
      </div>
    );
  }
  if (!inviteValid) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <div className="w-full max-w-sm space-y-8 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">COMP&apos;D</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Create your account
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-md px-3 py-2">
              {error}
            </p>
          )}
          {message && (
            <p className="text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 rounded-md px-3 py-2">
              {message}
            </p>
          )}
          <div>
            <label
              htmlFor="displayName"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Display name (optional)
            </label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              autoComplete="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            />
          </div>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            />
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              At least 6 characters
            </p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 py-2 px-4 font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? "Creating account…" : "Sign up"}
          </button>
        </form>
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          Already have an account?{" "}
          <a
            href="/login"
            className="font-medium text-zinc-900 dark:text-zinc-100 hover:underline"
          >
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
