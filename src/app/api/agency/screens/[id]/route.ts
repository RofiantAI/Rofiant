import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOwnedAgency, slugify } from "@/lib/agency-broadcast";

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
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (typeof body.title === "string" && body.title.trim()) update.title = body.title.trim();
  if (typeof body.content === "string") update.content = body.content;
  if (typeof body.slug === "string" && body.slug.trim()) update.slug = slugify(body.slug);
  if (typeof body.nav_label === "string") update.nav_label = body.nav_label.trim() || null;
  if (typeof body.published === "boolean") update.published = body.published;
  if (typeof body.show_in_nav === "boolean") update.show_in_nav = body.show_in_nav;

  const { data, error } = await supabase
    .from("agency_screens")
    .update(update)
    .eq("id", id)
    .eq("agency_id", agency.id)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
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
    .from("agency_screens")
    .delete()
    .eq("id", id)
    .eq("agency_id", agency.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
