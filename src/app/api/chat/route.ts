import { createGroq } from "@ai-sdk/groq";
import { streamText, convertToModelMessages } from "ai";
import { createClient } from "@/lib/supabase/server";

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

const ALLOWED_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "mixtral-8x7b-32768",
];

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { messages, conversationId, model, customInstructions, contextLimit, documentContents } = await req.json();

  const safeModel = ALLOWED_MODELS.includes(model) ? model : "llama-3.3-70b-versatile";
  const limit = typeof contextLimit === "number" && contextLimit > 0 ? contextLimit : 20;
  const trimmedMessages = messages.slice(-limit);

  const systemParts = [
    "You are Rofiant AI, a secure AI assistant for government agencies and enterprises. Be concise, accurate, and professional.",
  ];
  if (customInstructions?.trim()) systemParts.push(customInstructions.trim());

  // Inject pre-fetched document contents
  if (Array.isArray(documentContents) && documentContents.length > 0) {
    const docTexts = documentContents
      .filter((d: { name?: string; text?: string }) => d.name && d.text)
      .map((d: { name: string; text: string }) => `--- Document: ${d.name} ---\n${d.text}`);
    if (docTexts.length > 0) {
      systemParts.push("The user has attached the following documents for reference:\n\n" + docTexts.join("\n\n"));
    }
  }

  const result = streamText({
    model: groq(safeModel),
    system: systemParts.join("\n\n"),
    messages: await convertToModelMessages(trimmedMessages),
    async onFinish({ text }) {
      if (!conversationId) return;
      const { error: msgError } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        role: "assistant",
        content: text,
      });
      if (msgError) console.error("Failed to save assistant message:", msgError);
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId);
    },
  });

  return result.toUIMessageStreamResponse();
}
