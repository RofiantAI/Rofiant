import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type ConversationResult = {
  id: string;
  title: string;
  updated_at: string;
  pinned?: boolean;
  snippet?: string;
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
  const byId = new Map<string, ConversationResult>();

  const { data: titleMatches } = await supabase
    .from("conversations")
    .select("id, title, updated_at, pinned")
    .eq("user_id", user.id)
    .ilike("title", pattern)
    .order("updated_at", { ascending: false })
    .limit(30);

  for (const c of titleMatches ?? []) {
    byId.set(c.id, c);
  }

  const { data: messageMatches } = await supabase
    .from("messages")
    .select(
      "content, conversations!inner(id, title, updated_at, pinned, user_id)",
    )
    .eq("conversations.user_id", user.id)
    .ilike("content", pattern)
    .order("created_at", { ascending: false })
    .limit(40);

  for (const row of messageMatches ?? []) {
    const raw = row.conversations;
    const conv = (Array.isArray(raw) ? raw[0] : raw) as {
      id: string;
      title: string;
      updated_at: string;
      pinned?: boolean;
    } | null;
    if (!conv || byId.has(conv.id)) continue;

    const lower = row.content.toLowerCase();
    const idx = lower.indexOf(q.toLowerCase());
    const start = Math.max(0, idx - 40);
    const end = Math.min(row.content.length, idx + q.length + 60);
    const snippet =
      (start > 0 ? "…" : "") +
      row.content.slice(start, end).replace(/\s+/g, " ").trim() +
      (end < row.content.length ? "…" : "");

    byId.set(conv.id, { ...conv, snippet });
  }

  const results = [...byId.values()].sort(
    (a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  );

  return NextResponse.json(results);
}
