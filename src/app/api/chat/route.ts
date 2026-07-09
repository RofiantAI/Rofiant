import { createGroq } from "@ai-sdk/groq";
import { streamText, convertToModelMessages } from "ai";
import { createClient } from "@/lib/supabase/server";
import { ALL_MODELS, DEFAULT_FREE_MODEL } from "@/lib/chat-settings";
import { isMinorUser } from "@/lib/minor-account";
import { chatRatelimit, enforceRatelimit } from "@/lib/ratelimit";
import { getKnowledgeBaseContext } from "@/lib/knowledge-base-context";
import {
  supportsNativeReasoning,
  cleanAnswerText,
} from "@/lib/chat-reasoning";
import { CHAT_SYSTEM_PROMPT } from "@/lib/chat-copy";

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

const ALLOWED_MODELS = new Set(ALL_MODELS.map((m) => m.id));

const FREE_TIER_DAILY_MESSAGE_LIMIT = 100;

function lastUserText(messages: unknown[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i] as {
      role?: string;
      content?: string;
      parts?: { type: string; text?: string }[];
    };
    if (m.role !== "user") continue;
    if (typeof m.content === "string") return m.content;
    const part = m.parts?.find((p) => p.type === "text");
    if (part?.text) return part.text;
  }
  return "";
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const limited = await enforceRatelimit(chatRatelimit, user.id);
    if (limited) return limited;
  }

  const plan: string = (user.user_metadata?.plan ?? "free" as string).toLowerCase();
  const minor = isMinorUser(user);
  if (plan === "free" && !minor) {
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);

    const { data: convs } = await supabase.from("conversations").select("id").eq("user_id", user.id);
    const convIds = (convs ?? []).map((c) => c.id);

    let todayCount = 0;
    if (convIds.length > 0) {
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .in("conversation_id", convIds)
        .eq("role", "user")
        .gte("created_at", startOfDay.toISOString());
      todayCount = count ?? 0;
    }

    if (todayCount >= FREE_TIER_DAILY_MESSAGE_LIMIT) {
      return Response.json(
        { error: "You've hit today's free message limit. Upgrade to Pro for more." },
        { status: 429 },
      );
    }
  }

  const { messages, conversationId, model, customInstructions, contextLimit, documentContents, knowledgeBaseId } =
    await req.json();

  const safeModel = ALLOWED_MODELS.has(model) ? model : DEFAULT_FREE_MODEL;
  const limit = typeof contextLimit === "number" && contextLimit > 0 ? contextLimit : 20;
  const trimmedMessages = messages.slice(-limit);

  const systemParts = [CHAT_SYSTEM_PROMPT];
  if (customInstructions?.trim()) systemParts.push(customInstructions.trim());

  if (typeof knowledgeBaseId === "string" && knowledgeBaseId) {
    const query = lastUserText(trimmedMessages);
    const kbContext = await getKnowledgeBaseContext(user.id, knowledgeBaseId, query || "overview");
    if (kbContext.length > 0) {
      const kbText = kbContext
        .map((doc) => `--- ${doc.name} ---\n${doc.excerpts.join("\n\n")}`)
        .join("\n\n");
      systemParts.push(
        "Relevant excerpts from the user's knowledge base. Cite document names when using this information:\n\n" +
          kbText,
      );
    }
  }

  // Inject pre-fetched document contents
  if (Array.isArray(documentContents) && documentContents.length > 0) {
    const docTexts = documentContents
      .filter((d: { name?: string; text?: string }) => d.name && d.text)
      .map((d: { name: string; text: string }) => `--- Document: ${d.name} ---\n${d.text}`);
    if (docTexts.length > 0) {
      systemParts.push("The user has attached the following documents for reference:\n\n" + docTexts.join("\n\n"));
    }
  }

  const useNativeReasoning = supportsNativeReasoning(safeModel);

  const result = streamText({
    model: groq(safeModel),
    system: systemParts.join("\n\n"),
    messages: await convertToModelMessages(trimmedMessages),
    ...(useNativeReasoning && {
      reasoning: "medium" as const,
      providerOptions: {
        groq: {
          reasoningFormat: "parsed",
        },
      },
    }),
    async onFinish({ text, usage }) {
      if (minor) return;

      const content = cleanAnswerText(text);

      if (conversationId) {
        const { error: msgError } = await supabase.from("messages").insert({
          conversation_id: conversationId,
          role: "assistant",
          content,
        });
        if (msgError) console.error("Failed to save assistant message:", msgError);
        await supabase
          .from("conversations")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", conversationId);
      }

      const { error: usageError } = await supabase.from("usage_events").insert({
        user_id: user.id,
        source: "chat",
        model: safeModel,
        input_tokens: usage?.inputTokens ?? 0,
        output_tokens: usage?.outputTokens ?? 0,
      });
      if (usageError) console.error("Failed to record usage event:", usageError);
    },
  });

  return result.toUIMessageStreamResponse({ sendReasoning: false });
}
