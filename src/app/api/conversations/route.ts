import { createClient } from "@/lib/supabase/server";
import { isMinorUser } from "@/lib/minor-account";
import { NextResponse } from "next/server";

export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { error } = await supabase
    .from("conversations")
    .delete()
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  if (isMinorUser(user)) {
    const filename = `rofiant-chats-${new Date().toISOString().slice(0, 10)}.json`;
    return new NextResponse(JSON.stringify({ exported_at: new Date().toISOString(), conversations: [] }, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  const { data: conversations, error } = await supabase
    .from("conversations")
    .select("id, title, created_at, updated_at, messages(role, content, created_at)")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const filename = `rofiant-chats-${new Date().toISOString().slice(0, 10)}.json`;
  return new NextResponse(JSON.stringify({ exported_at: new Date().toISOString(), conversations }, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { title, firstMessage } = await req.json();

  if (isMinorUser(user)) {
    const now = new Date().toISOString();
    return NextResponse.json({
      id: crypto.randomUUID(),
      user_id: user.id,
      title: title ?? "New chat",
      created_at: now,
      updated_at: now,
      ephemeral: true,
    });
  }

  const { data: conversation, error } = await supabase
    .from("conversations")
    .insert({ user_id: user.id, title: title ?? "New chat" })
    .select()
    .single();

  if (error) {
    console.error("DB error creating conversation:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (firstMessage) {
    await supabase.from("messages").insert({
      conversation_id: conversation.id,
      role: "user",
      content: firstMessage,
    });
  }

  return NextResponse.json(conversation);
}
