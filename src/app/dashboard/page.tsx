import { createClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import { getBotModels, getMyBotConfigs, getMyKalshiCredentials } from "./actions";
import { DashboardClient } from "./DashboardClient";
import { BotConfigCard } from "./BotConfigCard";
import { KalshiCredentialsForm } from "./KalshiCredentialsForm";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("consent_given_at")
    .eq("id", user.id)
    .single();
  if (!profile?.consent_given_at) redirect("/onboarding/consent");

  const [models, configs, creds] = await Promise.all([
    getBotModels(),
    getMyBotConfigs(user.id),
    getMyKalshiCredentials(user.id),
  ]);

  const configByModel = new Map(configs.map((c) => [c.modelId, c]));

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <a href="/dashboard" className="text-lg font-semibold tracking-tight">
            COMP&apos;D
          </a>
          <nav className="flex items-center gap-4">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {user.email}
            </span>
            <DashboardClient />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-zinc-500 dark:text-zinc-400">
          Configure your bots and Kalshi API. Each bot runs independently; all
          trades and model data are collected for your cumulative view.
        </p>

        <section className="mt-8">
          <h2 className="mb-4 text-lg font-medium">Kalshi API</h2>
          <KalshiCredentialsForm
            userId={user.id}
            hasStoredCreds={!!creds}
            masked={creds?.masked ?? ""}
          />
        </section>

        <section className="mt-8">
          <h2 className="mb-4 text-lg font-medium">Bots</h2>
          {models.length === 0 ? (
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 text-sm text-zinc-500 dark:text-zinc-400">
              No bot models available yet. Run the database migration that
              seeds &quot;Trader Retro&quot; (see SETUP-STEPS-2-5.md and
              supabase/migrations/00002_models_and_rls.sql).
            </div>
          ) : (
            <div className="space-y-6">
              {models.map((model) => (
                <BotConfigCard
                  key={model.id}
                  model={model}
                  config={configByModel.get(model.id)}
                  userId={user.id}
                />
              ))}
            </div>
          )}
        </section>

        <div className="mt-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
          <h2 className="font-medium">Account</h2>
          <dl className="mt-2 space-y-1 text-sm">
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">Email</dt>
              <dd className="font-medium">{user.email}</dd>
            </div>
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">User ID</dt>
              <dd className="font-mono text-xs text-zinc-600 dark:text-zinc-300">
                {user.id}
              </dd>
            </div>
          </dl>
        </div>
      </main>
    </div>
  );
}
