import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { summarizeDocument } from "@/lib/document-processing";
import { extractTextFromBuffer, truncateText } from "@/lib/document-text";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;

  const { data: doc } = await supabase
    .from("documents")
    .select("name, type, storage_path, content_text, summary")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let text = doc.content_text ?? "";
  if (!text) {
    const { data: fileData } = await supabase.storage.from("documents").download(doc.storage_path);
    if (!fileData) return NextResponse.json({ error: "Failed to read document" }, { status: 500 });
    const buffer = Buffer.from(await fileData.arrayBuffer());
    text = truncateText(await extractTextFromBuffer(buffer, doc.type));
  }

  const summary = await summarizeDocument(doc.name, text);

  await supabase
    .from("documents")
    .update({ summary, content_text: text || null })
    .eq("id", id)
    .eq("user_id", user.id);

  return NextResponse.json({ summary });
}
