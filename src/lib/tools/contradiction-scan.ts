import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { extractTextFromBuffer, truncateText } from "@/lib/document-text";

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = "llama-3.3-70b-versatile";
const DOC_CHAR_LIMIT = 12_000;
const MIN_DOCS = 2;
const MAX_DOCS = 5;

const severity = z.enum(["critical", "high", "medium", "low"]);

export const contradictionScanSchema = z.object({
  summary: z.string(),
  overallRisk: z.enum(["critical", "high", "medium", "low", "none"]),
  contradictions: z.array(
    z.object({
      severity,
      category: z.enum([
        "dates",
        "amounts",
        "deliverables",
        "requirements",
        "scope",
        "parties",
        "other",
      ]),
      topic: z.string(),
      description: z.string(),
      docA: z.object({
        name: z.string(),
        excerpt: z.string(),
        location: z.string().optional(),
      }),
      docB: z.object({
        name: z.string(),
        excerpt: z.string(),
        location: z.string().optional(),
      }),
      recommendation: z.string(),
    }),
  ),
  alignedFacts: z.array(z.string()).default([]),
  reviewNotes: z.string(),
});

export type ContradictionScanOutput = z.infer<typeof contradictionScanSchema>;

export type ContradictionScanInput = {
  documentIds: string[];
  focusArea?: string;
};

async function loadDocumentTexts(
  supabase: SupabaseClient,
  userId: string,
  documentIds: string[],
) {
  const { data: docs } = await supabase
    .from("documents")
    .select("id, name, type, storage_path, content_text, status")
    .eq("user_id", userId)
    .in("id", documentIds);

  const loaded: { name: string; content: string }[] = [];

  for (const doc of docs ?? []) {
    let text = doc.content_text ?? "";
    if (!text && doc.storage_path) {
      const { data: fileData } = await supabase.storage.from("documents").download(doc.storage_path);
      if (fileData) {
        const buffer = Buffer.from(await fileData.arrayBuffer());
        text = truncateText(await extractTextFromBuffer(buffer, doc.type));
      }
    }
    if (text.trim()) {
      loaded.push({
        name: doc.name,
        content: text.slice(0, DOC_CHAR_LIMIT),
      });
    }
  }

  return loaded;
}

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced?.[1]?.trim() ?? text.trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Model did not return JSON");
  return JSON.parse(raw.slice(start, end + 1));
}

const JSON_SHAPE = `{
  "summary": "string — executive summary of cross-document consistency",
  "overallRisk": "critical|high|medium|low|none",
  "contradictions": [{
    "severity": "critical|high|medium|low",
    "category": "dates|amounts|deliverables|requirements|scope|parties|other",
    "topic": "short label",
    "description": "what conflicts and why it matters",
    "docA": { "name": "filename", "excerpt": "verbatim quote from doc A", "location": "section/page if known" },
    "docB": { "name": "filename", "excerpt": "verbatim quote from doc B", "location": "section/page if known" },
    "recommendation": "how to resolve before award/mod/sign-off"
  }],
  "alignedFacts": ["facts that match across documents — builds confidence"],
  "reviewNotes": "caveats, docs that did not overlap, human review reminders"
}`;

export async function runContradictionScan(
  supabase: SupabaseClient,
  userId: string,
  input: ContradictionScanInput,
): Promise<{ output: ContradictionScanOutput; usage: { inputTokens: number; outputTokens: number } }> {
  const ids = [...new Set(input.documentIds)];
  if (ids.length < MIN_DOCS) {
    throw new Error(`Select at least ${MIN_DOCS} documents`);
  }
  if (ids.length > MAX_DOCS) {
    throw new Error(`Maximum ${MAX_DOCS} documents per scan`);
  }

  const documents = await loadDocumentTexts(supabase, userId, ids);
  if (documents.length < MIN_DOCS) {
    throw new Error("Could not load text from enough documents — ensure files are indexed");
  }

  const docBlock = documents
    .map((d, i) => `--- Document ${i + 1}: ${d.name} ---\n${d.content}`)
    .join("\n\n");

  const focusBlock = input.focusArea?.trim()
    ? `\nReviewer focus: ${input.focusArea.trim()} — prioritize contradictions in this area.`
    : "";

  const systemPrompt = `You are a federal procurement and compliance document reviewer.
Compare uploaded documents for factual contradictions — dates, dollar amounts, deliverables, scope, party names, evaluation criteria, clause requirements.
Rules:
- Report ONLY real conflicts supported by verbatim excerpts from the provided documents.
- Never invent quotes, clause numbers, or dollar figures not present in the text.
- If documents cover different subjects with no overlap, set overallRisk to "none", contradictions to [], and explain in reviewNotes.
- Prefer fewer high-confidence findings over speculative mismatches.
- Excerpts must be copied from the document text (truncate with … if long).`;

  const userPrompt = [
    "Cross-check these documents for contradictions a contracting officer, COR, or legal reviewer must resolve before award, mod, or sign-off.",
    focusBlock,
    `\nDocuments:\n${docBlock}`,
    `\nRespond with ONLY valid JSON matching this shape:\n${JSON_SHAPE}`,
  ]
    .filter(Boolean)
    .join("\n");

  const result = await generateText({
    model: groq(MODEL),
    system: systemPrompt,
    prompt: userPrompt,
    maxOutputTokens: 4096,
  });

  const parsed = extractJson(result.text);
  const output = contradictionScanSchema.parse(parsed);

  return {
    output,
    usage: {
      inputTokens: result.usage?.inputTokens ?? 0,
      outputTokens: result.usage?.outputTokens ?? 0,
    },
  };
}
