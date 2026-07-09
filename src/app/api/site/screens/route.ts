import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSiteOwner } from "@/lib/site-owner";
import { slugify } from "@/lib/site-broadcast";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSiteOwner(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("site_screens")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
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
  const content = typeof body.content === "string" ? body.content : "";
  const slugInput = typeof body.slug === "string" ? body.slug.trim() : "";
  const slug = slugify(slugInput || title);
  const navLabel =
    typeof body.nav_label === "string" && body.nav_label.trim()
      ? body.nav_label.trim()
      : title;
  const published = body.published === true;
  const showInNav = body.show_in_nav !== false;

  if (!title || !slug) {
    return NextResponse.json({ error: "Title required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("site_screens")
    .insert({
      slug,
      title,
      content,
      nav_label: navLabel,
      published,
      show_in_nav: showInNav,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
