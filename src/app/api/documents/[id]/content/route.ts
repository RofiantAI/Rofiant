import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const MAX_CHARS = 40000;

async function extractText(buffer: Buffer, type: string): Promise<string> {
  const t = type.toLowerCase();

  if (t === "pdf") {
    const pdfParse = (await import("pdf-parse")).default;
    const result = await pdfParse(buffer);
    return result.text as string;
  }

  if (t === "docx") {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  // TXT, MD, CSV — plain text
  return buffer.toString("utf-8");
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;

  const { data: doc } = await supabase
    .from("documents")
    .select("name, type, storage_path")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!doc) return new NextResponse("Not found", { status: 404 });

  const { data: fileData, error } = await supabase.storage
    .from("documents")
    .download(doc.storage_path);

  if (error || !fileData) {
    return NextResponse.json({ error: "Failed to download file" }, { status: 500 });
  }

  const buffer = Buffer.from(await fileData.arrayBuffer());

  try {
    let text = await extractText(buffer, doc.type);
    if (text.length > MAX_CHARS) text = text.slice(0, MAX_CHARS) + "\n[truncated]";
    return NextResponse.json({ name: doc.name, type: doc.type, text });
  } catch (err) {
    return NextResponse.json(
      { error: `Could not extract text: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 },
    );
  }
}
