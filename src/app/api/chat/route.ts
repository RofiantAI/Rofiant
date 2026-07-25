import { createGroq } from "@ai-sdk/groq";
import { streamText, convertToModelMessages } from "ai";
import { createClient } from "@/lib/supabase/server";
import { ALL_MODELS, DEFAULT_FREE_MODEL, isVisionModel } from "@/lib/chat-settings";
import { PLAN_MODE_INSTRUCTION } from "@/lib/chat-agents";
import { isMinorUser } from "@/lib/minor-account";
import { chatRatelimit, enforceRatelimit } from "@/lib/ratelimit";
import {
  supportsNativeReasoning,
  reasoningEffortFor,
  cleanAnswerText,
} from "@/lib/chat-reasoning";
import { CHAT_SYSTEM_PROMPT } from "@/lib/chat-copy";

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

const ALLOWED_MODELS = new Set(ALL_MODELS.map((m) => m.id));

const FREE_TIER_DAILY_MESSAGE_LIMIT = 100;

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

  const {
    messages,
    conversationId,
    model,
    customInstructions,
    contextLimit,
    documentContents,
    image,
    mode,
    agentSystemPrompt,
    rulesPrompt,
  } = await req.json();

  const safeModel = ALLOWED_MODELS.has(model) ? model : DEFAULT_FREE_MODEL;
  const limit = typeof contextLimit === "number" && contextLimit > 0 ? contextLimit : 20;
  const trimmedMessages = messages.slice(-limit);

  if (typeof image === "string" && image && isVisionModel(safeModel)) {
    for (let i = trimmedMessages.length - 1; i >= 0; i--) {
      if (trimmedMessages[i].role === "user") {
        const mediaType = image.slice(5, image.indexOf(";")) || "image/png";
        trimmedMessages[i] = {
          ...trimmedMessages[i],
          parts: [...(trimmedMessages[i].parts ?? []), { type: "file", mediaType, url: image }],
        };
        break;
      }
    }
  }

  // Older history entries can carry an empty text part with no attachment
  // (e.g. an image-only send from before content was backfilled with a
  // placeholder, or any other message stored with empty content). Groq
  // rejects a message whose content resolves to an empty array outright,
  // which would otherwise 400 every future turn in that conversation. Runs
  // after the image attach above so it never touches the live message that
  // just received a file part.
  for (const m of trimmedMessages) {
    const parts = m.parts ?? [];
    const hasContent = parts.some(
      (p: { type: string; text?: string }) =>
        p.type !== "text" || (p.text && p.text.trim().length > 0),
    );
    if (!hasContent) {
      m.parts = [...parts, { type: "text", text: "[empty message]" }];
    }
  }

  const systemParts = [CHAT_SYSTEM_PROMPT];
  if (customInstructions?.trim()) systemParts.push(customInstructions.trim());
  if (mode === "plan") systemParts.push(PLAN_MODE_INSTRUCTION);
  if (typeof agentSystemPrompt === "string" && agentSystemPrompt.trim()) {
    systemParts.push(agentSystemPrompt.trim());
  }
  if (typeof rulesPrompt === "string" && rulesPrompt.trim()) {
    systemParts.push(rulesPrompt.trim());
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
      reasoning: reasoningEffortFor(safeModel),
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
