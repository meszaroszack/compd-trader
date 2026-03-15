"use client";

import { createClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export function DashboardClient() {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={signOut}
      className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
    >
      Sign out
    </button>
  );
}
