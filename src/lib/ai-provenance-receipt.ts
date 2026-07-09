/** Version tag for workflow prompts — bump when prompt logic changes materially. */
export const AI_PROMPT_VERSION = "2026-07-06";
export const AI_MODEL_ID = "llama-3.3-70b-versatile";
export const AI_PROVIDER = "groq";

export type ProvenanceReceiptInput = {
  source: "federal_workflow" | "contradiction_scan";
  runId?: string | null;
  solutionId?: string;
  taskLabel?: string;
  title?: string;
  runAt?: string;
  inputText?: string;
  documentIds?: string[];
  documentNames?: string[];
  options?: Record<string, string>;
  includeReferencePack?: boolean;
  output: unknown;
  usage?: { inputTokens: number; outputTokens: number };
};

export type ProvenanceReceipt = {
  receiptVersion: "1.0";
  type: "rofiant-ai-provenance";
  generatedAt: string;
  source: ProvenanceReceiptInput["source"];
  run: {
    id: string | null;
    solutionId?: string;
    taskLabel?: string;
    title?: string;
    completedAt?: string;
  };
  model: {
    provider: string;
    id: string;
    promptVersion: string;
  };
  input: {
    textCharacterCount: number;
    textSha256: string | null;
    documentIds: string[];
    documentNames: string[];
    options: Record<string, string>;
    includeReferencePack?: boolean;
  };
  output: {
    sha256: string;
    summaryPreview: string | null;
  };
  usage: {
    inputTokens: number | null;
    outputTokens: number | null;
  };
  compliance: {
    humanReviewRequired: true;
    auditActions: string[];
    frameworks: string[];
    disclaimer: string;
  };
};

export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function summaryPreview(output: unknown): string | null {
  if (!output || typeof output !== "object") return null;
  const summary = (output as { summary?: unknown }).summary;
  if (typeof summary !== "string" || !summary.trim()) return null;
  const trimmed = summary.trim();
  return trimmed.length > 280 ? `${trimmed.slice(0, 277)}…` : trimmed;
}

export async function buildProvenanceReceipt(
  input: ProvenanceReceiptInput,
): Promise<ProvenanceReceipt> {
  const outputJson = JSON.stringify(input.output);
  const normalizedInput = input.inputText?.trim() ?? "";

  const [textSha256, outputSha256] = await Promise.all([
    normalizedInput ? sha256Hex(normalizedInput) : Promise.resolve(null),
    sha256Hex(outputJson),
  ]);

  const auditAction =
    input.source === "federal_workflow" ? "federal_workflow.run" : "contradiction_scan.run";

  return {
    receiptVersion: "1.0",
    type: "rofiant-ai-provenance",
    generatedAt: new Date().toISOString(),
    source: input.source,
    run: {
      id: input.runId ?? null,
      solutionId: input.solutionId,
      taskLabel: input.taskLabel,
      title: input.title,
      completedAt: input.runAt,
    },
    model: {
      provider: AI_PROVIDER,
      id: AI_MODEL_ID,
      promptVersion: AI_PROMPT_VERSION,
    },
    input: {
      textCharacterCount: normalizedInput.length,
      textSha256,
      documentIds: input.documentIds ?? [],
      documentNames: input.documentNames ?? [],
      options: input.options ?? {},
      includeReferencePack: input.includeReferencePack,
    },
    output: {
      sha256: outputSha256,
      summaryPreview: summaryPreview(input.output),
    },
    usage: {
      inputTokens: input.usage?.inputTokens ?? null,
      outputTokens: input.usage?.outputTokens ?? null,
    },
    compliance: {
      humanReviewRequired: true,
      auditActions: [auditAction],
      frameworks: ["OMB M-24-10", "NIST AI RMF 1.0", "NIST 800-53 AU family"],
      disclaimer:
        "AI-generated output requires human review before use in official decisions, releases, or adjudications. This receipt documents model inputs and output integrity — not legal sufficiency.",
    },
  };
}

export function provenanceReceiptFilename(prefix: string, runAt?: string) {
  const stamp = runAt ? new Date(runAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
  return `${prefix}-provenance-${stamp}.json`;
}
