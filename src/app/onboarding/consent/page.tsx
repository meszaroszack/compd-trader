import { createClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import { ConsentForm } from "./ConsentForm";

export default async function ConsentPage() {
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

  if (profile?.consent_given_at) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6">
      <div className="max-w-lg space-y-8">
        <h1 className="text-2xl font-semibold">Data & consent</h1>
        <ul className="list-disc list-inside space-y-2 text-zinc-400">
          <li>You get free access to a live Kalshi trading bot (beta).</li>
          <li>
            COMP&apos;D collects: trade signals, strategy telemetry, market
            timing — no PII in traded data.
          </li>
          <li>
            Data is used to train COMP&apos;D&apos;s AI models, internal only,
            not sold to third parties.
          </li>
          <li>
            By continuing you agree to this use. You can delete your account
            and data at any time.
          </li>
        </ul>
        <ConsentForm userId={user.id} />
      </div>
    </div>
  );
}
