import { createClient } from "@/lib/supabase/server";
import { isMinorUser } from "@/lib/minor-account";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  if (isMinorUser(user)) {
    return NextResponse.json({ ok: true, ephemeral: true });
  }

  const { conversationId, content } = await req.json();

  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    role: "user",
    content,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
