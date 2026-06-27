import { createGroq } from "@ai-sdk/groq";
import { generateText, streamText } from "ai";
import { validateApiKey, apiError } from "@/lib/api-auth";
import { randomUUID } from "crypto";

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

const MODEL_MAP: Record<string, string> = {
  // Aliases users can send
  "groq-llama-3.3-70b":  "llama-3.3-70b-versatile",
  "groq-llama-3.1-8b":   "llama-3.1-8b-instant",
  "groq-mixtral-8x7b":   "mixtral-8x7b-32768",
  // Pass-through canonical names
  "llama-3.3-70b-versatile": "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant":    "llama-3.1-8b-instant",
  "mixtral-8x7b-32768":      "mixtral-8x7b-32768",
};

const DEFAULT_MODEL = "llama-3.3-70b-versatile";

type OAIMessage = { role: "system" | "user" | "assistant"; content: string };

export async function POST(req: Request) {
  const apiKeyUser = await validateApiKey(req.headers.get("authorization"));
  if (!apiKeyUser) return apiError("Invalid or missing API key", 401);

  const isPaid = apiKeyUser.plan === "pro" || apiKeyUser.plan === "team";
  if (!isPaid) return apiError("API access requires a Pro or Team plan", 403);

  let body: {
    model?: string;
    messages?: OAIMessage[];
    stream?: boolean;
    temperature?: number;
    max_tokens?: number;
    system?: string;
  };

  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const { messages, stream = false, temperature, max_tokens, system } = body;

  if (!messages?.length) return apiError("messages is required", 400);

  const resolvedModel = MODEL_MAP[body.model ?? ""] ?? DEFAULT_MODEL;

  // Separate system message if present in messages array
  const systemMessages = messages.filter((m) => m.role === "system").map((m) => m.content);
  const chatMessages = messages.filter((m) => m.role !== "system") as { role: "user" | "assistant"; content: string }[];
  const systemPrompt = [
    "You are Rofiant AI, a secure AI assistant for government agencies and enterprises.",
    system,
    ...systemMessages,
  ]
    .filter(Boolean)
    .join("\n\n");

  const id = `chatcmpl-${randomUUID().replace(/-/g, "").slice(0, 20)}`;
  const created = Math.floor(Date.now() / 1000);

  if (stream) {
    const result = streamText({
      model: groq(resolvedModel),
      system: systemPrompt,
      messages: chatMessages,
      temperature,
      maxTokens: max_tokens,
    });

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.textStream) {
            const data = JSON.stringify({
              id,
              object: "chat.completion.chunk",
              created,
              model: resolvedModel,
              choices: [{ index: 0, delta: { content: chunk }, finish_reason: null }],
            });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
          const done = JSON.stringify({
            id,
            object: "chat.completion.chunk",
            created,
            model: resolvedModel,
            choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
          });
          controller.enqueue(encoder.encode(`data: ${done}\n\n`));
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  }

  // Non-streaming
  const { text, usage } = await generateText({
    model: groq(resolvedModel),
    system: systemPrompt,
    messages: chatMessages,
    temperature,
    maxTokens: max_tokens,
  });

  return Response.json({
    id,
    object: "chat.completion",
    created,
    model: resolvedModel,
    choices: [
      {
        index: 0,
        message: { role: "assistant", content: text },
        finish_reason: "stop",
      },
    ],
    usage: {
      prompt_tokens: usage?.inputTokens ?? 0,
      completion_tokens: usage?.outputTokens ?? 0,
      total_tokens: (usage?.inputTokens ?? 0) + (usage?.outputTokens ?? 0),
    },
  });
}
