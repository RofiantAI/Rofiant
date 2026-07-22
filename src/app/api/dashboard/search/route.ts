import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export type DashboardSearchResult = {
  type: "conversation";
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

  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, title, updated_at")
    .eq("user_id", user.id)
    .ilike("title", pattern)
    .order("updated_at", { ascending: false })
    .limit(8);

  for (const c of conversations ?? []) {
    results.push({
      type: "conversation",
      id: c.id,
      title: c.title,
      href: `/chat/${c.id}`,
    });
  }

  return NextResponse.json(results);
}
