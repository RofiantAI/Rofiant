"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, Loader2, Play, Landmark } from "lucide-react";
import {
  DashboardPage,
  DashboardHeader,
  DashboardCard,
  DashboardPrimaryButton,
  DashboardUpgradeGate,
} from "@/components/dashboard/ui/page-shell";
import { WORKFLOW_INPUTS } from "@/lib/federal-workflows/prompts";
import { getReferencePack } from "@/lib/federal-workflows/reference-packs";
import { getWorkflowCategoryKey } from "@/lib/federal-workflows/categories";
import { getDefaultTaskId, getWorkflowTasks } from "@/lib/federal-workflows/tasks";
import { isFederalSolutionId, type FederalSolutionId } from "@/lib/federal-solutions";
import type { WorkflowOutputMap } from "@/lib/federal-workflows/schemas";
import { WorkflowOutputView } from "./workflow-output";
import { WorkflowDocUpload, type WorkflowDoc } from "./workflow-doc-upload";
import { WorkflowHistoryPanel, type WorkflowRunRow } from "./workflow-history";
import { WorkflowExportBar } from "./workflow-export-bar";

const WORKFLOW_LABELS: Record<FederalSolutionId, string> = {
  acquisitionContracts: "Federal Acquisition",
  benefitsClaims: "Benefits & Claims",
  regulatoryRulemaking: "Regulatory & Rulemaking",
  citizenServices: "Citizen Services",
  legalFoia: "Legal & FOIA",
  cyberAto: "Cybersecurity & ATO",
  grantsFinancial: "Grants & Financial",
  humanCapital: "Human Capital",
};

export function FederalWorkflowClient({ solutionId }: { solutionId: string }) {
  const t = useTranslations("dashboard.agency.solutions.workflow");
  const tCat = useTranslations("dashboard.agency.solutions.categories");
  const tSolutions = useTranslations("solutions.federalAgencies.useCases");
  const valid = isFederalSolutionId(solutionId);
  const tasks = valid ? getWorkflowTasks(solutionId) : [];
  const inputDef = valid ? WORKFLOW_INPUTS[solutionId] : null;
  const categoryKey = valid ? getWorkflowCategoryKey(solutionId) : null;
  const hasReferencePack = valid ? Boolean(getReferencePack(solutionId)) : false;

  const [taskId, setTaskId] = useState(() => (valid ? getDefaultTaskId(solutionId) : ""));
  const activeTask = tasks.find((t) => t.id === taskId) ?? tasks[0];

  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [docs, setDocs] = useState<WorkflowDoc[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [inputText, setInputText] = useState("");
  const [options, setOptions] = useState<Record<string, string>>({});
  const [includeReferencePack, setIncludeReferencePack] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [output, setOutput] = useState<WorkflowOutputMap[FederalSolutionId] | null>(null);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [activeRunAt, setActiveRunAt] = useState<string | undefined>();
  const [activeUsage, setActiveUsage] = useState<{ inputTokens: number; outputTokens: number } | undefined>();
  const [activeDocumentIds, setActiveDocumentIds] = useState<string[]>([]);
  const [history, setHistory] = useState<WorkflowRunRow[]>([]);

  const loadDocs = useCallback(() => {
    fetch("/api/documents")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setDocs(data);
      });
  }, []);

  const loadHistory = useCallback(() => {
    if (!valid) return;
    fetch(`/api/federal-solutions/${solutionId}/run`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.runs)) setHistory(data.runs);
      });
  }, [solutionId, valid]);

  useEffect(() => {
    fetch("/api/federal-solutions")
      .then((r) => r.json())
      .then((data) => setAllowed(Boolean(data.allowed)))
      .catch(() => setAllowed(false));

    loadDocs();
    loadHistory();
  }, [loadDocs, loadHistory]);

  async function runWorkflow() {
    if (!valid) return;
    setRunning(true);
    setError("");
    setOutput(null);
    setActiveRunId(null);

    const res = await fetch(`/api/federal-solutions/${solutionId}/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskId,
        documentIds: selectedDocs,
        inputText,
        options,
        includeReferencePack,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? t("errors.failed"));
      setRunning(false);
      return;
    }

    setOutput(data.output);
    setActiveRunId(data.runId ?? null);
    setActiveRunAt(data.createdAt ?? undefined);
    setActiveUsage(data.usage);
    setActiveDocumentIds(selectedDocs);
    loadHistory();
    setRunning(false);
  }

  function selectHistoryRun(run: WorkflowRunRow) {
    setOutput(run.output as WorkflowOutputMap[FederalSolutionId]);
    setActiveRunId(run.id);
    setActiveRunAt(run.created_at);
    setActiveUsage(undefined);
    setActiveDocumentIds(Array.isArray(run.document_ids) ? run.document_ids : []);
    if (run.input?.inputText) setInputText(run.input.inputText);
  }

  if (!valid) {
    return (
      <DashboardPage>
        <p className="text-sm text-foreground-muted">{t("errors.invalid")}</p>
        <Link href="/dashboard/agency/solutions" className="text-sm text-accent-primary mt-4 inline-block">
          ← {t("back")}
        </Link>
      </DashboardPage>
    );
  }

  if (allowed === null) {
    return (
      <DashboardPage>
        <Loader2 className="w-5 h-5 animate-spin text-foreground-muted" />
      </DashboardPage>
    );
  }

  if (!allowed) {
    return (
      <DashboardPage>
        <DashboardUpgradeGate
          icon={Landmark}
          title={t("upgrade.title")}
          description={t("upgrade.description")}
          ctaHref="/pricing"
          ctaLabel={t("upgrade.cta")}
        />
      </DashboardPage>
    );
  }

  const deptTitle = tSolutions(`${solutionId}.dept`);

  return (
    <DashboardPage>
      <nav className="flex flex-wrap items-center gap-2 text-xs text-foreground-muted mb-2">
        <Link href="/dashboard/agency/solutions" className="hover:text-foreground inline-flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" />
          {t("back")}
        </Link>
        {categoryKey && (
          <>
            <span>/</span>
            <span>{tCat(categoryKey)}</span>
          </>
        )}
      </nav>

      <DashboardHeader
        title={deptTitle}
        description={activeTask?.description ?? tSolutions(`${solutionId}.agencies`)}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1 space-y-6">
          <DashboardCard className="space-y-4">
            <h3 className="text-sm font-medium text-foreground">{t("inputs.title")}</h3>

            <div>
              <label className="text-xs text-foreground-muted block mb-1.5">{t("inputs.task")}</label>
              <select
                value={taskId}
                onChange={(e) => setTaskId(e.target.value)}
                className="w-full h-9 px-3 rounded-md bg-background-secondary border border-border text-sm text-foreground focus:outline-none focus:border-accent-primary"
              >
                {tasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.label}
                  </option>
                ))}
              </select>
              {activeTask && (
                <p className="text-xs text-foreground-muted mt-1.5">{activeTask.description}</p>
              )}
            </div>

            <div>
              <label className="text-xs text-foreground-muted block mb-1.5">
                {activeTask?.inputLabel ?? inputDef?.label}
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={4}
                placeholder={activeTask?.inputPlaceholder ?? inputDef?.placeholder}
                className="w-full px-3 py-2 rounded-md bg-background-secondary border border-border text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-accent-primary resize-none"
              />
            </div>

            {inputDef?.options?.map((opt) => (
              <div key={opt.key}>
                <label className="text-xs text-foreground-muted block mb-1.5">{opt.label}</label>
                <input
                  value={options[opt.key] ?? ""}
                  onChange={(e) => setOptions((prev) => ({ ...prev, [opt.key]: e.target.value }))}
                  placeholder={opt.placeholder}
                  className="w-full h-9 px-3 rounded-md bg-background-secondary border border-border text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-accent-primary"
                />
              </div>
            ))}

            {hasReferencePack && (
              <label className="flex items-start gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeReferencePack}
                  onChange={(e) => setIncludeReferencePack(e.target.checked)}
                  className="mt-1 rounded border-border"
                />
                <span>
                  <span className="text-foreground block">{t("referencePack.label")}</span>
                  <span className="text-xs text-foreground-muted">{t("referencePack.desc")}</span>
                </span>
              </label>
            )}

            <WorkflowDocUpload
              docs={docs}
              selectedDocs={selectedDocs}
              onDocsChange={setDocs}
              onSelectionChange={setSelectedDocs}
            />

            {error && <p className="text-xs text-red-400">{error}</p>}

            <DashboardPrimaryButton
              type="button"
              onClick={runWorkflow}
              disabled={running || (selectedDocs.length === 0 && !inputText.trim())}
            >
              {running ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("running")}
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  {t("run", { workflow: activeTask?.label ?? WORKFLOW_LABELS[solutionId] })}
                </>
              )}
            </DashboardPrimaryButton>
          </DashboardCard>

          <DashboardCard>
            <h3 className="text-sm font-medium text-foreground mb-3">{t("history.title")}</h3>
            <WorkflowHistoryPanel runs={history} activeRunId={activeRunId} onSelect={selectHistoryRun} />
          </DashboardCard>
        </div>

        <DashboardCard className="xl:col-span-2">
          <h3 className="text-sm font-medium text-foreground mb-4">{t("results.title")}</h3>
          {!output ? (
            <p className="text-sm text-foreground-muted">{t("results.empty")}</p>
          ) : (
            <>
              <WorkflowExportBar
                title={deptTitle}
                solutionId={solutionId}
                output={output}
                inputText={inputText}
                runAt={activeRunAt}
                taskLabel={activeTask?.label}
                runId={activeRunId}
                usage={activeUsage}
                documentIds={activeDocumentIds.length ? activeDocumentIds : selectedDocs}
                documentNames={(activeDocumentIds.length ? activeDocumentIds : selectedDocs)
                  .map((id) => docs.find((d) => d.id === id)?.name)
                  .filter((name): name is string => Boolean(name))}
                options={options}
                includeReferencePack={includeReferencePack}
              />
              <WorkflowOutputView solutionId={solutionId} output={output} />
            </>
          )}
        </DashboardCard>
      </div>
    </DashboardPage>
  );
}
