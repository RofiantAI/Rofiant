"use client";

import { useTranslations } from "next-intl";
import type { WorkflowOutputMap } from "@/lib/federal-workflows/schemas";

export type WorkflowRunRow = {
  id: string;
  solution_id: string;
  input: { inputText?: string };
  output: WorkflowOutputMap[keyof WorkflowOutputMap];
  document_ids?: string[];
  created_at: string;
};

export function WorkflowHistoryPanel({
  runs,
  activeRunId,
  onSelect,
}: {
  runs: WorkflowRunRow[];
  activeRunId: string | null;
  onSelect: (run: WorkflowRunRow) => void;
}) {
  const t = useTranslations("dashboard.agency.solutions.workflow");

  if (runs.length === 0) {
    return <p className="text-xs text-foreground-muted py-2">{t("history.empty")}</p>;
  }

  return (
    <div className="space-y-1 max-h-64 overflow-y-auto">
      {runs.map((run) => {
        const active = run.id === activeRunId;
        const summary =
          typeof run.output === "object" && run.output && "summary" in run.output
            ? String((run.output as { summary: string }).summary).slice(0, 120)
            : t("history.runFallback");
        return (
          <button
            key={run.id}
            type="button"
            onClick={() => onSelect(run)}
            className={`w-full text-left px-3 py-2 rounded-md border text-xs transition-colors ${
              active
                ? "border-accent-primary/40 bg-accent-primary/5"
                : "border-border hover:bg-background-tertiary"
            }`}
          >
            <span className="text-foreground-muted tabular-nums block mb-1">
              {new Date(run.created_at).toLocaleString()}
            </span>
            <span className="text-foreground-secondary line-clamp-2">{summary}</span>
          </button>
        );
      })}
    </div>
  );
}
