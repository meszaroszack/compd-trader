import { createClient } from "@/lib/supabaseServer";
import Link from "next/link";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-8">
      <main className="flex flex-col gap-6 items-center text-center max-w-md">
        <h1 className="text-3xl font-semibold tracking-tight">COMP&apos;D</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Multi-tenant Kalshi trading. Run your bots and keep your data in one
          place.
        </p>
        {user ? (
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/dashboard"
              className="rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 py-2 px-4 font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200"
            >
              Go to dashboard
            </Link>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/login"
              className="rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 py-2 px-4 font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200"
            >
              Sign in
            </Link>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Invite-only beta. Sign up via your invite link.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
