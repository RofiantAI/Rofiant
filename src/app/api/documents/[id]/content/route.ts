import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { extractTextFromBuffer, truncateText } from "@/lib/document-text";

const MAX_CHARS = 40000;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;

  const { data: doc } = await supabase
    .from("documents")
    .select("name, type, storage_path, content_text")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!doc) return new NextResponse("Not found", { status: 404 });

  if (doc.content_text) {
    return NextResponse.json({ name: doc.name, type: doc.type, text: doc.content_text });
  }

  const { data: fileData, error } = await supabase.storage
    .from("documents")
    .download(doc.storage_path);

  if (error || !fileData) {
    return NextResponse.json({ error: "Failed to download file" }, { status: 500 });
  }

  const buffer = Buffer.from(await fileData.arrayBuffer());

  try {
    let text = await extractTextFromBuffer(buffer, doc.type);
    if (text.length > MAX_CHARS) text = truncateText(text);
    return NextResponse.json({ name: doc.name, type: doc.type, text });
  } catch (err) {
    return NextResponse.json(
      { error: `Could not extract text: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 },
    );
  }
}
