import { validateInviteToken } from "@/lib/invite";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  if (!token) {
    return NextResponse.json({ valid: false, reason: "Missing token" }, { status: 400 });
  }
  const status = await validateInviteToken(token);
  return NextResponse.json(
    status.valid
      ? { valid: true, remainingSeats: status.remainingSeats }
      : { valid: false, reason: status.reason }
  );
}
