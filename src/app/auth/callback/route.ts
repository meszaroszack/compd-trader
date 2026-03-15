import { createClient } from "@/lib/supabaseServer";
import { NextResponse } from "next/server";
import { consumeInviteToken } from "@/lib/invite";
import { cookies } from "next/headers";

const INVITE_COOKIE = "compd_invite_token";

/**
 * Supabase redirects here after sign-in/sign-up (e.g. email confirm).
 * Exchange code for session, consume invite token if present, then redirect to dashboard.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const inviteFromUrl = searchParams.get("invite");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      const inviteToken = inviteFromUrl ?? (await cookies()).get(INVITE_COOKIE)?.value;
      if (inviteToken) {
        await consumeInviteToken(inviteToken, data.user.id);
        const res = NextResponse.redirect(`${origin}${next}`);
        res.cookies.set(INVITE_COOKIE, "", { path: "/", maxAge: 0 });
        return res;
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
