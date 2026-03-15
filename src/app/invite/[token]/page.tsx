import { validateInviteToken } from "@/lib/invite";
import Link from "next/link";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const status = await validateInviteToken(token);

  if (!status.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-6">
        <div className="text-center text-zinc-400">
          <p className="text-lg">This link is no longer valid.</p>
          <p className="mt-2 text-sm">{status.reason}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 p-6 text-zinc-100">
      <div className="max-w-md text-center space-y-8">
        <h1 className="text-2xl font-semibold tracking-tight">COMP&apos;D</h1>
        <div className="space-y-4">
          <h2 className="text-3xl font-semibold">You&apos;ve Been Selected.</h2>
          <p className="text-zinc-400 text-lg leading-relaxed">
            You&apos;re one of 100 invited to the COMP&apos;D closed beta. Free
            AI-powered Kalshi trading. No strings — just signal.
          </p>
        </div>
        <Link
          href={`/signup?invite=${token}`}
          className="inline-block rounded-md bg-white text-zinc-900 font-medium py-3 px-8 hover:bg-zinc-100 transition-colors"
        >
          Create Your Account →
        </Link>
        <p className="text-sm text-zinc-500">
          Invite-only beta. 100 seats total. {status.remainingSeats} remaining.
        </p>
      </div>
    </div>
  );
}
