import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for use in the browser (Client Components, client-side code).
 * Uses the anon key; security is enforced by Row Level Security (RLS) in Supabase.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
