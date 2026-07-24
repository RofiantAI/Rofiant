import { NextRequest, NextResponse } from "next/server";
import { getAuthedUser } from "@/lib/api-auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await getAuthedUser(req);
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { data, error } = await supabase
    .from("knowledge_bases")
    .select("*, knowledge_base_documents(*, documents(id, name, type, size))")
    .eq("id", id)
    .eq("owner_id", user.id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await getAuthedUser(req);
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { name, description } = await req.json();
  const patch: Record<string, string> = { updated_at: new Date().toISOString() };
  if (name?.trim())       patch.name        = name.trim();
  if (description != null) patch.description = description.trim();

  const { data, error } = await supabase
    .from("knowledge_bases")
    .update(patch)
    .eq("id", id)
    .eq("owner_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await getAuthedUser(req);
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { error } = await supabase
    .from("knowledge_bases")
    .delete()
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
