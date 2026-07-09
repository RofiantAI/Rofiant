"use client";

import { useTranslations } from "next-intl";
import type { FederalSolutionId } from "@/lib/federal-solutions";
import type { WorkflowOutputMap } from "@/lib/federal-workflows/schemas";
import { buildProvenanceReceipt, provenanceReceiptFilename } from "@/lib/ai-provenance-receipt";
import { downloadTextFile } from "@/lib/federal-workflows/export";

export function WorkflowExportBar({
  title,
  solutionId,
  output,
  inputText,
  runAt,
  taskLabel,
  runId,
  usage,
  documentIds = [],
  documentNames = [],
  options = {},
  includeReferencePack,
}: {
  title: string;
  solutionId: FederalSolutionId;
  output: WorkflowOutputMap[FederalSolutionId];
  inputText: string;
  runAt?: string;
  taskLabel?: string;
  runId?: string | null;
  usage?: { inputTokens: number; outputTokens: number };
  documentIds?: string[];
  documentNames?: string[];
  options?: Record<string, string>;
  includeReferencePack?: boolean;
}) {
  const t = useTranslations("dashboard.agency.solutions.workflow");

  async function handleExport(format: "json" | "markdown" | "print" | "receipt") {
    const { workflowOutputToMarkdown, printWorkflowReport, workflowOutputToPrintHtml } =
      await import("@/lib/federal-workflows/export");

    const meta = { runAt, inputText, taskLabel };
    const stamp = runAt ? new Date(runAt).toISOString().slice(0, 10) : "report";

    if (format === "receipt") {
      const receipt = await buildProvenanceReceipt({
        source: "federal_workflow",
        runId,
        solutionId,
        taskLabel,
        title,
        runAt,
        inputText,
        documentIds,
        documentNames,
        options,
        includeReferencePack,
        output,
        usage,
      });
      downloadTextFile(
        provenanceReceiptFilename(solutionId, runAt),
        JSON.stringify(receipt, null, 2),
        "application/json",
      );
      return;
    }

    if (format === "json") {
      downloadTextFile(
        `${solutionId}-${stamp}.json`,
        JSON.stringify({ solutionId, title, ...meta, output }, null, 2),
        "application/json",
      );
      return;
    }

    if (format === "markdown") {
      downloadTextFile(
        `${solutionId}-${stamp}.md`,
        workflowOutputToMarkdown(solutionId, title, output as Record<string, unknown>, meta),
        "text/markdown",
      );
      return;
    }

    printWorkflowReport(
      title,
      workflowOutputToPrintHtml(title, output as Record<string, unknown>, meta),
    );
  }

  return (
    <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-border">
      <button
        type="button"
        onClick={() => handleExport("receipt")}
        className="text-xs px-3 py-1.5 rounded-md border border-accent-primary/40 bg-accent-primary/5 text-foreground hover:bg-accent-primary/10"
      >
        {t("export.receipt")}
      </button>
      <button
        type="button"
        onClick={() => handleExport("json")}
        className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-background-tertiary"
      >
        {t("export.json")}
      </button>
      <button
        type="button"
        onClick={() => handleExport("markdown")}
        className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-background-tertiary"
      >
        {t("export.markdown")}
      </button>
      <button
        type="button"
        onClick={() => handleExport("print")}
        className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-background-tertiary"
      >
        {t("export.pdf")}
      </button>
    </div>
  );
}
