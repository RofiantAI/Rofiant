import { createClient } from "@/lib/supabase/server";
import { chatRatelimit, enforceRatelimit } from "@/lib/ratelimit";

const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const limited = await enforceRatelimit(chatRatelimit, user.id);
    if (limited) return limited;
  }

  let body: { audioBase64?: string; mimeType?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { audioBase64, mimeType } = body;
  if (!audioBase64 || !mimeType) {
    return Response.json({ error: "audioBase64 and mimeType are required" }, { status: 400 });
  }

  const buffer = Buffer.from(audioBase64, "base64");
  if (buffer.byteLength === 0) {
    return Response.json({ error: "Empty audio" }, { status: 400 });
  }
  if (buffer.byteLength > MAX_AUDIO_BYTES) {
    return Response.json({ error: "Audio is too large (max 10MB)" }, { status: 400 });
  }

  const extension = mimeType.includes("webm") ? "webm" : mimeType.includes("ogg") ? "ogg" : "wav";
  const form = new FormData();
  form.append("file", new Blob([buffer], { type: mimeType }), `audio.${extension}`);
  form.append("model", "whisper-large-v3-turbo");
  form.append("response_format", "json");

  const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    body: form,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error("Transcription failed:", res.status, errText);
    return Response.json({ error: "Transcription failed" }, { status: 502 });
  }

  const data = await res.json();
  return Response.json({ text: (data.text ?? "").trim() });
}
