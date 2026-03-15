import { db } from "@/lib/db";
import { profiles, trades } from "../../../shared/schema";
import { sql, desc, isNotNull } from "drizzle-orm";
import { getRemainingSeats } from "@/lib/invite";
import { AdminActions } from "./AdminActions";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const remaining = await getRemainingSeats();

  const userList = await db
    .select({
      id: profiles.id,
      displayName: profiles.displayName,
      inviteTokenUsed: profiles.inviteTokenUsed,
      consentGivenAt: profiles.consentGivenAt,
      kalshiEnv: profiles.kalshiEnv,
      createdAt: profiles.createdAt,
    })
    .from(profiles)
    .where(isNotNull(profiles.inviteTokenUsed))
    .orderBy(desc(profiles.createdAt));

  let countByUser = new Map<string, number>();
  try {
    const tradeCounts = await db
      .select({
        userId: trades.userId,
        count: sql<number>`count(*)::int`,
      })
      .from(trades)
      .groupBy(trades.userId);
    countByUser = new Map(tradeCounts.map((r) => [r.userId, r.count]));
  } catch {
    // trades table may not exist yet
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <h1 className="text-2xl font-semibold mb-6">COMP&apos;D Admin</h1>
      <p className="text-zinc-400 mb-8">
        Beta seats: {remaining} remaining of 100.
      </p>

      <section className="mb-8">
        <h2 className="text-lg font-medium mb-4">Generate invite</h2>
        <AdminActions remaining={remaining} />
      </section>

      <section>
        <h2 className="text-lg font-medium mb-4">Beta users</h2>
        <div className="overflow-x-auto rounded border border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-left">
                <th className="p-3">User ID</th>
                <th className="p-3">Display name</th>
                <th className="p-3">Consent</th>
                <th className="p-3">Kalshi env</th>
                <th className="p-3">Joined</th>
                <th className="p-3">Trades</th>
              </tr>
            </thead>
            <tbody>
              {userList.map((u) => (
                <tr key={u.id} className="border-b border-zinc-800/50">
                  <td className="p-3 font-mono text-xs">{u.id.slice(0, 8)}…</td>
                  <td className="p-3">{u.displayName ?? "—"}</td>
                  <td className="p-3">
                    {u.consentGivenAt
                      ? new Date(u.consentGivenAt).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="p-3">{u.kalshiEnv ?? "demo"}</td>
                  <td className="p-3">
                    {u.createdAt
                      ? new Date(u.createdAt).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="p-3">{countByUser.get(u.id) ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {userList.length === 0 && (
          <p className="text-zinc-500 mt-4">No beta users yet.</p>
        )}
      </section>
    </div>
  );
}
