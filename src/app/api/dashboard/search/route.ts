import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export type DashboardSearchResult = {
  type: "conversation" | "document" | "agent" | "knowledge_base";
  id: string;
  title: string;
  subtitle?: string;
  href: string;
};

function escapeIlike(value: string) {
  return value.replace(/[%_\\]/g, "\\$&");
}

export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 1) return NextResponse.json([]);

  const pattern = `%${escapeIlike(q)}%`;
  const results: DashboardSearchResult[] = [];

  const [
    { data: conversations },
    { data: documents },
    { data: agents },
    { data: knowledgeBases },
  ] = await Promise.all([
    supabase
      .from("conversations")
      .select("id, title, updated_at")
      .eq("user_id", user.id)
      .ilike("title", pattern)
      .order("updated_at", { ascending: false })
      .limit(8),
    supabase
      .from("documents")
      .select("id, name, category, summary")
      .eq("user_id", user.id)
      .ilike("name", pattern)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("agents")
      .select("id, name, description, status")
      .eq("user_id", user.id)
      .ilike("name", pattern)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("knowledge_bases")
      .select("id, name, description")
      .eq("owner_id", user.id)
      .ilike("name", pattern)
      .order("updated_at", { ascending: false })
      .limit(8),
  ]);

  for (const c of conversations ?? []) {
    results.push({
      type: "conversation",
      id: c.id,
      title: c.title,
      href: `/chat/${c.id}`,
    });
  }

  for (const d of documents ?? []) {
    results.push({
      type: "document",
      id: d.id,
      title: d.name,
      subtitle: d.category ?? d.summary ?? undefined,
      href: "/dashboard/documents",
    });
  }

  for (const a of agents ?? []) {
    results.push({
      type: "agent",
      id: a.id,
      title: a.name,
      subtitle: a.description || a.status,
      href: "/dashboard/agents",
    });
  }

  for (const kb of knowledgeBases ?? []) {
    results.push({
      type: "knowledge_base",
      id: kb.id,
      title: kb.name,
      subtitle: kb.description || undefined,
      href: `/dashboard/knowledge-bases/${kb.id}`,
    });
  }

  return NextResponse.json(results);
}
