import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

export async function classifyDocument(name: string, text: string): Promise<string> {
  const sample = text.slice(0, 3000);
  const { text: category } = await generateText({
    model: groq("llama-3.1-8b-instant"),
    prompt: `Classify this document into one short category label (2-4 words). Reply with only the label.\n\nFilename: ${name}\n\n${sample}`,
  });
  return category.trim().slice(0, 80);
}

export async function summarizeDocument(name: string, text: string): Promise<string> {
  const { text: summary } = await generateText({
    model: groq("llama-3.1-8b-instant"),
    prompt: `Summarize this document in 3-5 bullet points.\n\nDocument: ${name}\n\n${text.slice(0, 12000)}`,
  });
  return summary.trim();
}
