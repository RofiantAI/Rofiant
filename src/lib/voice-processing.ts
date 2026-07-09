import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

export async function transcribeAudio(buffer: Buffer, filename: string): Promise<string> {
  const blob = new Blob([new Uint8Array(buffer)], { type: "audio/mpeg" });
  const form = new FormData();
  form.append("file", blob, filename);
  form.append("model", "whisper-large-v3");
  form.append("response_format", "json");

  const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    body: form,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Transcription failed: ${err}`);
  }

  const data = (await res.json()) as { text?: string };
  return data.text?.trim() ?? "";
}

export async function summarizeTranscript(transcript: string): Promise<string> {
  if (!transcript.trim()) return "";

  const { text } = await generateText({
    model: groq("llama-3.1-8b-instant"),
    prompt: `Summarize this transcript. Include key decisions and action items as bullet points.\n\n${transcript.slice(0, 12000)}`,
  });

  return text.trim();
}
