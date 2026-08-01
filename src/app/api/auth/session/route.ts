import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  let user;
  try {
    ({ data: { user } } = await supabase.auth.getUser());
  } catch (err) {
    // Stale/rotated refresh token cookie — same as a logged-out request.
    if ((err as { code?: string })?.code === "refresh_token_not_found") {
      return NextResponse.json({ user: null }, { status: 401 });
    }
    throw err;
  }
  if (!user) return NextResponse.json({ user: null }, { status: 401 });
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata,
    },
  });
}
