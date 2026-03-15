import { createInviteToken } from "@/lib/invite";
import { NextResponse } from "next/server";

export async function POST() {
  const result = await createInviteToken();
  if (!result) {
    return NextResponse.json(
      { error: "Beta is full or could not create token." },
      { status: 400 }
    );
  }
  return NextResponse.json({ token: result.token, url: result.url });
}
