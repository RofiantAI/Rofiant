import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { memberId, action } = await req.json();
  if (!memberId || !["accept", "decline"].includes(action)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const admin = createAdminClient();

  if (action === "accept") {
    const { error } = await admin
      .from("agency_members")
      .update({ status: "active", joined_at: new Date().toISOString() })
      .eq("id", memberId)
      .eq("user_id", user.id)
      .eq("status", "pending");

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await admin
      .from("agency_members")
      .delete()
      .eq("id", memberId)
      .eq("user_id", user.id)
      .eq("status", "pending");

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
