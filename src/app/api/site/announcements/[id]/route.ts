import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSiteOwner } from "@/lib/site-owner";

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

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("site_announcements")
    .update(update)
    .eq("id", id)
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
  const auth = await requireSiteOwner();
  if ("error" in auth && auth.error) return auth.error;

  const admin = createAdminClient();
  const { error } = await admin.from("site_announcements").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
