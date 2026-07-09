import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSiteOwner } from "@/lib/site-owner";
import { getActiveSiteAnnouncements } from "@/lib/site-broadcast";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const announcements = await getActiveSiteAnnouncements(supabase);
  return NextResponse.json(announcements, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSiteOwner(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const text = typeof body.body === "string" ? body.body.trim() : "";
  const variant = ["info", "warning", "critical"].includes(body.variant)
    ? body.variant
    : "info";
  const active = body.active !== false;

  if (!title || !text) {
    return NextResponse.json({ error: "Title and body required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("site_announcements")
    .insert({
      title,
      body: text,
      variant,
      active,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
