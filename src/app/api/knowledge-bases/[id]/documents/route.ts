import { NextRequest, NextResponse } from "next/server";
import { getAuthedUser } from "@/lib/api-auth";

async function ownsKb(supabase: Awaited<ReturnType<typeof getAuthedUser>>["supabase"], id: string, userId: string) {
  const { data } = await supabase
    .from("knowledge_bases")
    .select("id")
    .eq("id", id)
    .eq("owner_id", userId)
    .single();
  return !!data;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await getAuthedUser(req);
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  if (!await ownsKb(supabase, id, user.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { document_id } = await req.json();
  if (!document_id) return NextResponse.json({ error: "document_id required" }, { status: 400 });

  // Verify user owns the document
  const { data: doc } = await supabase
    .from("documents")
    .select("id")
    .eq("id", document_id)
    .eq("user_id", user.id)
    .single();
  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  const { data, error } = await supabase
    .from("knowledge_base_documents")
    .insert({ kb_id: id, document_id })
    .select()
    .single();

  if (error?.code === "23505") return NextResponse.json({ error: "Already in knowledge base" }, { status: 409 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("knowledge_bases").update({ updated_at: new Date().toISOString() }).eq("id", id);
  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await getAuthedUser(req);
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  if (!await ownsKb(supabase, id, user.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { document_id } = await req.json();
  await supabase.from("knowledge_base_documents").delete().eq("kb_id", id).eq("document_id", document_id);
  return new NextResponse(null, { status: 204 });
}
