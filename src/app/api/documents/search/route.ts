import { NextRequest, NextResponse } from "next/server";
import { searchText } from "@/lib/document-text";
import { getAuthedUser } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const { supabase, user } = await getAuthedUser(req);
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!q) return NextResponse.json({ results: [] });

  const { data: docs, error } = await supabase
    .from("documents")
    .select("id, name, type, category, summary, content_text")
    .eq("user_id", user.id)
    .eq("status", "indexed")
    .not("content_text", "is", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results = (docs ?? [])
    .flatMap((doc) => {
      const excerpts = searchText(doc.content_text ?? "", q, 2);
      if (excerpts.length === 0) return [];
      return [{
        id: doc.id,
        name: doc.name,
        type: doc.type,
        category: doc.category,
        summary: doc.summary,
        excerpts,
      }];
    })
    .slice(0, 20);

  return NextResponse.json({ results });
}
