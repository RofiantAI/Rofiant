import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOwnedAgency } from "@/lib/agency-broadcast";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const agency = await getOwnedAgency(supabase, user.id);
  if (!agency) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const update: Record<string, unknown> = {};

  if (typeof body.title === "string" && body.title.trim()) update.title = body.title.trim();
  if (typeof body.body === "string" && body.body.trim()) update.body = body.body.trim();
  if (["info", "warning", "critical"].includes(body.variant)) update.variant = body.variant;
  if (typeof body.active === "boolean") update.active = body.active;
  if (body.expires_at === null) update.expires_at = null;
  if (typeof body.expires_at === "string") update.expires_at = body.expires_at;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("agency_announcements")
    .update(update)
    .eq("id", id)
    .eq("agency_id", agency.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const agency = await getOwnedAgency(supabase, user.id);
  if (!agency) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { error } = await supabase
    .from("agency_announcements")
    .delete()
    .eq("id", id)
    .eq("agency_id", agency.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
