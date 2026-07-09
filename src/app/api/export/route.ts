import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { isMinorUser } from "@/lib/minor-account";

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  if (isMinorUser(user)) {
    const exportPayload = {
      exported_at: new Date().toISOString(),
      account: { id: user.id, email: user.email, minor_mode: true },
      conversations: [],
      messages: [],
      documents: [],
      agents: [],
      api_keys: [],
    };

    return new Response(JSON.stringify(exportPayload, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="rofiant-export-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  }

  const [{ data: conversations }, { data: documents }, { data: agents }, { data: apiKeys }] = await Promise.all([
    supabase.from("conversations").select("id, title, created_at, updated_at").eq("user_id", user.id),
    supabase.from("documents").select("id, name, type, size, status, created_at").eq("user_id", user.id),
    supabase.from("agents").select("id, name, description, status, runs, created_at").eq("user_id", user.id),
    supabase.from("api_keys").select("id, name, key_prefix, created_at, last_used_at").eq("user_id", user.id),
  ]);

  const conversationIds = (conversations ?? []).map((c) => c.id);
  const { data: messages } =
    conversationIds.length > 0
      ? await supabase
          .from("messages")
          .select("id, conversation_id, role, content, created_at")
          .in("conversation_id", conversationIds)
      : { data: [] };

  const exportPayload = {
    exported_at: new Date().toISOString(),
    account: { id: user.id, email: user.email },
    conversations,
    messages,
    documents,
    agents,
    api_keys: apiKeys,
  };

  const ip = req.headers.get("x-forwarded-for") ?? undefined;
  logAudit({ userId: user.id, action: "data.exported", detail: {}, ip }).catch(() => {});

  return new Response(JSON.stringify(exportPayload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="rofiant-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
