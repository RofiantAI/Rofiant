import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { FederalSolutionId } from "@/lib/federal-solutions";
import { isFederalSolutionId } from "@/lib/federal-solutions";
import { extractTextFromBuffer, truncateText } from "@/lib/document-text";
import {
  WORKFLOW_OUTPUT_SCHEMAS,
  type WorkflowOutputMap,
} from "./schemas";
import { WORKFLOW_PROMPTS } from "./prompts";
import { formatZodError, normalizeWorkflowPayload } from "./normalize";
import { getReferencePack } from "./reference-packs";
import { getWorkflowTask } from "./tasks";

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = "llama-3.3-70b-versatile";
const DOC_CHAR_LIMIT = 14_000;

export type WorkflowRunInput = {
  solutionId: FederalSolutionId;
  taskId?: string;
  documentIds: string[];
  inputText: string;
  options?: Record<string, string>;
  includeReferencePack?: boolean;
};

async function loadDocumentTexts(
  supabase: SupabaseClient,
  userId: string,
  documentIds: string[],
) {
  if (documentIds.length === 0) return [];

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

export async function runFederalWorkflow(
  supabase: SupabaseClient,
  userId: string,
  input: WorkflowRunInput,
): Promise<{ output: WorkflowOutputMap[FederalSolutionId]; usage: { inputTokens: number; outputTokens: number } }> {
  if (!isFederalSolutionId(input.solutionId)) {
    throw new Error("Invalid solution");
  }

  const documents = await loadDocumentTexts(supabase, userId, input.documentIds);
  const schema = WORKFLOW_OUTPUT_SCHEMAS[input.solutionId];
  const promptDef = WORKFLOW_PROMPTS[input.solutionId];
  const task = input.taskId ? getWorkflowTask(input.solutionId, input.taskId) : undefined;

  const docBlock =
    documents.length > 0
      ? documents
          .map((d, i) => `--- Document ${i + 1}: ${d.name} ---\n${d.content}`)
          .join("\n\n")
      : "(No documents attached — use user input and reference pack only)";

  const optionsBlock = input.options
    ? Object.entries(input.options)
        .filter(([, v]) => v?.trim())
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n")
    : "";

  const referencePack =
    input.includeReferencePack !== false ? getReferencePack(input.solutionId) : null;

  const taskBlock = task
    ? [
        `Mission task: ${task.label}`,
        task.taskInstruction,
        `Required outputs: ${task.outputFocus}`,
        "Populate deliverables[] with ready-to-use drafts (letters, memos, checklists). Populate actionItems[] with concrete next steps for agency staff.",
      ].join("\n")
    : "";

  const userPrompt = [
    task?.taskInstruction ?? promptDef.task,
    taskBlock,
    input.inputText.trim() ? `\nUser input:\n${input.inputText.trim()}` : "",
    optionsBlock ? `\nOptions:\n${optionsBlock}` : "",
    referencePack ? `\nReference pack:\n${referencePack}` : "",
    `\nSupporting documents:\n${docBlock}`,
    `\nRespond with ONLY valid JSON matching this shape:\n${promptDef.jsonShape}`,
  ]
    .filter(Boolean)
    .join("\n");

  const result = await generateText({
    model: groq(MODEL),
    system: promptDef.system,
    prompt: userPrompt,
  });

  const parsed = extractJson(result.text);
  const normalized = normalizeWorkflowPayload(input.solutionId, parsed);
  const validated = schema.safeParse(normalized);
  if (!validated.success) {
    throw new Error(formatZodError(validated.error));
  }
  const output = validated.data as WorkflowOutputMap[FederalSolutionId];

  return {
    output,
    usage: {
      inputTokens: result.usage.inputTokens ?? 0,
      outputTokens: result.usage.outputTokens ?? 0,
    },
  };
}
