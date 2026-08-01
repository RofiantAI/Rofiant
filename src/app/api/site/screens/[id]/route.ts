import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSiteOwner } from "@/lib/site-owner";
import { slugify } from "@/lib/site-pages";

async function requireSiteOwner() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (!isSiteOwner(user.email)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { user };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const auth = await requireSiteOwner();
  if ("error" in auth && auth.error) return auth.error;

  const body = await req.json();
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (typeof body.title === "string" && body.title.trim()) update.title = body.title.trim();
  if (typeof body.content === "string") update.content = body.content;
  if (typeof body.slug === "string" && body.slug.trim()) update.slug = slugify(body.slug);
  if (typeof body.nav_label === "string") update.nav_label = body.nav_label.trim() || null;
  if (typeof body.published === "boolean") update.published = body.published;
  if (typeof body.show_in_nav === "boolean") update.show_in_nav = body.show_in_nav;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("site_screens")
    .update(update)
    .eq("id", id)
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
  const auth = await requireSiteOwner();
  if ("error" in auth && auth.error) return auth.error;

  const admin = createAdminClient();
  const { error } = await admin.from("site_screens").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
