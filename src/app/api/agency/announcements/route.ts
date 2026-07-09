import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOwnedAgency, getUserAgencyIds, getActiveAnnouncements } from "@/lib/agency-broadcast";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const owned = await getOwnedAgency(supabase, user.id);
  if (owned) {
    const { data, error } = await supabase
      .from("agency_announcements")
      .select("*")
      .eq("agency_id", owned.id)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  }

  const agencyIds = await getUserAgencyIds(supabase, user.id);
  if (agencyIds.length === 0) return NextResponse.json([]);

  const announcements = await getActiveAnnouncements(supabase, agencyIds);
  return NextResponse.json(announcements);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const agency = await getOwnedAgency(supabase, user.id);
  if (!agency) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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

  const { data, error } = await supabase
    .from("agency_announcements")
    .insert({
      agency_id: agency.id,
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
